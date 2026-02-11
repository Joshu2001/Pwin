import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Search, Users, Clock, Trash, Trash2, Ban, Crown, Gift, Megaphone, Filter, Plus, Copy, Home, Image as ImageIcon, AlertCircle, Maximize2, CheckCircle, AlertTriangle, Star } from 'lucide-react';
import SupportTicketPanel from './SupportTicketPanel.jsx';

const STAFF_BACKEND_PLACEHOLDER = (typeof window !== 'undefined' && window.__BACKEND_URL__)
  || import.meta.env.VITE_BACKEND_URL
  || import.meta.env.VITE_BACKEND
  || 'https://pwin.onrender.com';
const getStaffBackendBaseUrl = () => {
  if (typeof window !== 'undefined' && window.__BACKEND_URL__) return window.__BACKEND_URL__;
  return STAFF_BACKEND_PLACEHOLDER;
};

const nativeFetch = (...args) => globalThis.fetch(...args);
const staffFetch = (input, init) => {
  const base = getStaffBackendBaseUrl();
  const resolvedUrl = typeof input === 'string'
    ? input.replace(STAFF_BACKEND_PLACEHOLDER, base)
    : input;
  return nativeFetch(resolvedUrl, init);
};

const fetch = staffFetch;

// Utility: convert hex color to rgba string
function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Beautiful Dropdown Component with Icons/Emojis
function BeautifulDropdown({ value, onChange, options, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px 12px',
          marginTop: 6,
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500,
          color: '#374151',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.borderColor = '#3b82f6'}
        onMouseLeave={(e) => e.target.style.borderColor = '#e5e7eb'}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{selectedOption?.icon}</span>
          {selectedOption?.label}
        </span>
        <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
      </button>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 4,
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                padding: '12px 12px',
                border: 'none',
                background: value === option.value ? '#eff6ff' : 'white',
                borderBottom: '1px solid #f3f4f6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: '#374151',
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f0f9ff';
                e.target.style.color = '#0369a1';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = value === option.value ? '#eff6ff' : 'white';
                e.target.style.color = '#374151';
              }}
            >
              <span style={{ fontSize: 18 }}>{option.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{option.label}</div>
                {option.description && (
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{option.description}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Component for Bottom Ad Preview Bar with Text Animation
function BottomAdPreviewBar({ profileName, profileAvatar, textItems, textInterval, textAnimation, cardAnimation, cardEffect, link }) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    if (textItems.length === 0) return;
    const interval = setInterval(() => {
      setCurrentTextIndex(prev => (prev + 1) % textItems.length);
    }, textInterval);
    return () => clearInterval(interval);
  }, [textItems.length, textInterval]);

  const getAnimationKeyframes = () => {
    const duration = (textInterval / 1000).toFixed(2);
    switch(textAnimation) {
      case 'slide-left': return `slideLeftIn 0.4s ease`;
      case 'slide-right': return `slideRightIn 0.4s ease`;
      case 'bounce': return `bounceIn 0.5s ease`;
      case 'scale': return `scaleIn 0.4s ease`;
      default: return `fadeInOut ${duration}s ease`;
    }
  };

  const getCardAnimation = () => {
    const entryAnimation = (() => {
      switch(cardAnimation) {
        case 'line-first': return `lineAppear 0.3s ease, slideDown 0.4s ease 0.3s`;
        case 'slide-down': return `slideDown 0.4s ease`;
        case 'bounce-in': return `bounceInCard 0.5s ease`;
        case 'scale-up': return `scaleUpCard 0.4s ease`;
        default: return `fadeInOut 0.6s ease`;
      }
    })();
    
    if (cardEffect && cardEffect !== 'none') {
      return `${entryAnimation}, ${cardEffect} 2s ease-in-out infinite 0.5s`;
    }
    return entryAnimation;
  };

  const currentText = textItems[currentTextIndex] || 'Your ad text goes here';

  return (
    <div style={{
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 20,
      background: 'rgba(17,24,39,0.9)',
      color: 'white',
      borderRadius: 12,
      padding: '8px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      maxWidth: 'calc(100% - 32px)',
      animation: getCardAnimation(),
      borderLeft: cardAnimation === 'line-first' ? '3px solid #8b5cf6' : 'none'
    }}>
      {profileAvatar ? (
        <img src={profileAvatar} alt="avatar" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontWeight: 700, flexShrink: 0 }}>
          {(profileName || '').charAt(0).toUpperCase() || 'A'}
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800 }}>{profileName || 'Advertiser'}</div>
        <div key={currentTextIndex} style={{
          fontSize: 13,
          color: '#e6eef8',
          outline: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          animation: getAnimationKeyframes()
        }}>
          {currentText}
        </div>
      </div>
      <a href={link || '#'} target="_blank" rel="noreferrer" style={{ background: '#fff', color: '#111827', padding: '8px 10px', borderRadius: 8, textDecoration: 'none', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>Learn more</a>
    </div>
  );
}

export default function StaffDashboard() {
  const [staffSession, setStaffSession] = useState(null);
  const [staffNotifications, setStaffNotifications] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [activeTab, setActiveTab] = useState('videos'); // 'videos', 'requests', 'comments', 'reports', 'users', 'creators', 'shadowDeleted', 'approvals', 'promotions', 'templates', 'ads', 'feedback', 'support', 'myProfile', 'onboarding'
  const [onboardingList, setOnboardingList] = useState([]);
  const [adAssets, setAdAssets] = useState([]);
  const [selectedAdVideo, setSelectedAdVideo] = useState(null);
  const [videoPreviewState, setVideoPreviewState] = useState({ isPlaying: false, currentTime: 0, videoDuration: 100, overlayPosition: { x: 50, y: 50 }, overlaySize: { width: 80, height: 60 }, isDragging: false, dragStart: { x: 0, y: 0 } });
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [reportCategory, setReportCategory] = useState('all'); // 'all', 'users', 'creators', 'requests', 'ads', 'videos'
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [creators, setCreators] = useState([]);
  const [shadowDeleted] = useState([]);
  const [pendingAccounts, setPendingAccounts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [requests, setRequests] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Ads UI state: show chooser and selected mode
  const [showAdsOptions, setShowAdsOptions] = useState(false);
  const [adsMode, setAdsMode] = useState(null); // 'video' | 'overlay' | 'bottom'
  // Bottom ad config state
  const [bottomAdProfileName, setBottomAdProfileName] = useState('');
  const [bottomAdProfileAvatar, setBottomAdProfileAvatar] = useState('');
  const [bottomAdText, setBottomAdText] = useState('');
  const [bottomAdTextItems, setBottomAdTextItems] = useState([]);
  const [bottomAdTextInterval, setBottomAdTextInterval] = useState(5000);
  const [bottomAdTextAnimation, setBottomAdTextAnimation] = useState('fade');
  const [bottomAdCardAnimation, setBottomAdCardAnimation] = useState('fade');
  const [bottomAdCardEffect, setBottomAdCardEffect] = useState('none');
  const [bottomAdCardExitAnimation, setBottomAdCardExitAnimation] = useState('fadeOut');
  const [bottomAdBorderColor, setBottomAdBorderColor] = useState('rgba(255, 0, 255, 0.6)');
  const [bottomAdLink, setBottomAdLink] = useState('');
  const [showBottomPreview, setShowBottomPreview] = useState(false);
  // Overlay ads state
  const [overlayAdCompanyName, setOverlayAdCompanyName] = useState('');
  const [overlayAdText, setOverlayAdText] = useState('');
  const [overlayAdEmoji, setOverlayAdEmoji] = useState('⚡');
  const [overlayAdTextItems, setOverlayAdTextItems] = useState([]);
  const [overlayAdBgColor, setOverlayAdBgColor] = useState('#E41E24');
  const [overlayAdTextColor, setOverlayAdTextColor] = useState('#fff');
  // Floating brand button colors
  const [overlayBrandBgColor, setOverlayBrandBgColor] = useState('#ffffff');
  const [overlayBrandTextColor, setOverlayBrandTextColor] = useState('#000000');
  const [overlayAdOpacity, setOverlayAdOpacity] = useState(1);
  const [overlayTagOpacity, setOverlayTagOpacity] = useState(1);
  const [overlayAdPosition, setOverlayAdPosition] = useState('bottom');
  const [overlayBtnText, setOverlayBtnText] = useState('Learn More');
  const [overlayProfileUrl, setOverlayProfileUrl] = useState('');
  const [overlayVideoUrl, setOverlayVideoUrl] = useState('');
  const [overlayExitTransition, setOverlayExitTransition] = useState('fade'); // 'fade', 'dissolve', 'blinds', 'wilt', 'random'
  const [overlayExitTransitionOpen, setOverlayExitTransitionOpen] = useState(false);
  const [overlayBadgeType, setOverlayBadgeType] = useState('ad'); // 'ad', 'sponsoredBy', 'none'
  const [overlayBadgeColor, setOverlayBadgeColor] = useState('#ff0000'); // Red by default for AD
  const [overlayBadgeLogo, setOverlayBadgeLogo] = useState(''); // URL for sponsor logo
  const [overlayBadgePosition, setOverlayBadgePosition] = useState('top-left-video'); // Badge position on video
  const [overlayBadgeTypeOpen, setOverlayBadgeTypeOpen] = useState(false);
  const [overlayBadgePositionOpen, setOverlayBadgePositionOpen] = useState(false);
  const [overlayCtaText, setOverlayCtaText] = useState('');
  const [overlayCtaColor, setOverlayCtaColor] = useState('#4B9EFF');
  const [overlayCtaType, setOverlayCtaType] = useState('text'); // 'text', 'image', 'video', 'gif'
  const [overlayCtaMedia, setOverlayCtaMedia] = useState(''); // URL for image/video/gif
  const [overlayCtaDelay, setOverlayCtaDelay] = useState(0); // Seconds before CTA appears
  const [overlayCtaDuration, setOverlayCtaDuration] = useState(3); // Seconds CTA is visible
  const [overlayTextAnimation, setOverlayTextAnimation] = useState('marquee'); // 'marquee', 'fade', 'slide'
  const [showOverlayPreview, setShowOverlayPreview] = useState(false);
  const [overlayPositionOpen, setOverlayPositionOpen] = useState(false);
  const [overlayEmojiOpen, setOverlayEmojiOpen] = useState(false);
  // Overlay template and apply states
  const [overlayTemplates, setOverlayTemplates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('overlayTemplates') || '[]');
    } catch (e) { return []; }
  });
  const [overlayTemplateName, setOverlayTemplateName] = useState('');
  const [showOverlaySaveModal, setShowOverlaySaveModal] = useState(false);
  const [showOverlayApplyModal, setShowOverlayApplyModal] = useState(false);
  const [showOverlayTemplatesModal, setShowOverlayTemplatesModal] = useState(false);
  const [overlayApplyVideoSearch, setOverlayApplyVideoSearch] = useState('');
  const [overlayApplyStartTime, setOverlayApplyStartTime] = useState(0);
  const [overlayApplyEndTime, setOverlayApplyEndTime] = useState(30);
  const [overlayApplySelectedVideos, setOverlayApplySelectedVideos] = useState([]);
  // Preview display toggles
  const [previewShowAdBar, setPreviewShowAdBar] = useState(true);
  const [previewLandscape, setPreviewLandscape] = useState(true);
  const [bottomAdTemplates, setBottomAdTemplates] = useState([]);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [editingBottomTemplate, setEditingBottomTemplate] = useState(null);
  const [selectedVideoForAdMgmt, setSelectedVideoForAdMgmt] = useState(null); // For managing ads on a video
  const [expandedTemplateUrls, setExpandedTemplateUrls] = useState({}); // Track expanded URLs per template
  
  // Video ad config state
  const [videoAdTitle, setVideoAdTitle] = useState('');
  const [videoAdCtaText, setVideoAdCtaText] = useState('Learn More');
  const [videoAdCtaColor, setVideoAdCtaColor] = useState('#0b74de');
  const [videoAdLink, setVideoAdLink] = useState('');
  const [showVideoAdPreview, setShowVideoAdPreview] = useState(false);
  
  // Default 2 ad config state
  const [default2LineColor, setDefault2LineColor] = useState('#d946ef');
  const [default2BgColor, setDefault2BgColor] = useState('#ffffff');
  const [default2TextColor, setDefault2TextColor] = useState('#111827');
  const [default2Title, setDefault2Title] = useState('');
  const [default2Description, setDefault2Description] = useState('');
  const [default2Logo, setDefault2Logo] = useState('');
  const [default2Link, setDefault2Link] = useState('');
  const [showDefault2Preview, setShowDefault2Preview] = useState(false);
  const [default2Templates, setDefault2Templates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('default2Templates') || '[]');
    } catch (e) { return []; }
  });
  const [showDefault2TemplatesModal, setShowDefault2TemplatesModal] = useState(false);
  const [default2TemplateName, setDefault2TemplateName] = useState('');
  const [showDefault2SaveModal, setShowDefault2SaveModal] = useState(false);
  const [showDefault2ApplyModal, setShowDefault2ApplyModal] = useState(false);
  const [default2ApplyVideoSearch, setDefault2ApplyVideoSearch] = useState('');
  const [default2ApplyStartTime, setDefault2ApplyStartTime] = useState(0);
  const [default2ApplyDuration, setDefault2ApplyDuration] = useState(30);
  const [default2ApplyDisplayCount, setDefault2ApplyDisplayCount] = useState(1);
  const [default2ApplySelectedVideos, setDefault2ApplySelectedVideos] = useState([]);

  // Fetch templates from backend (with localStorage fallback)
  const fetchBottomAdTemplates = async () => {
    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/templates/bottom`);
      if (res.ok) {
        const data = await res.json();
        setBottomAdTemplates(data.templates || []);
        localStorage.setItem('bottomAdTemplates', JSON.stringify(data.templates || []));
        return;
      }
    } catch (e) {
      // ignore
    }
    try {
      const raw = localStorage.getItem('bottomAdTemplates');
      const list = raw ? JSON.parse(raw) : [];
      setBottomAdTemplates(list);
    } catch (e) { setBottomAdTemplates([]); }
  };

  useEffect(() => { fetchBottomAdTemplates(); }, []);

  // Save template locally and to backend
  const saveBottomAdTemplate = async () => {
    if (!bottomAdProfileName || bottomAdTextItems.length === 0) {
      setToast({ type: 'error', title: 'Missing fields', message: 'Please provide profile name and at least one text item.' });
      return;
    }
    const tpl = {
      name: bottomAdProfileName,
      avatar: bottomAdProfileAvatar,
      textItems: bottomAdTextItems,
      textInterval: bottomAdTextInterval,
      textAnimation: bottomAdTextAnimation,
      cardAnimation: bottomAdCardAnimation,
      cardEffect: bottomAdCardEffect,
      cardExitAnimation: bottomAdCardExitAnimation,
      borderColor: bottomAdBorderColor,
      link: bottomAdLink,
      assets: adAssets
    };
    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/templates/bottom`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tpl) });
      if (res.ok) {
        const saved = await res.json();
        const list = [saved.template, ...(bottomAdTemplates || [])];
        setBottomAdTemplates(list);
        localStorage.setItem('bottomAdTemplates', JSON.stringify(list));
        setToast({ type: 'success', title: 'Saved', message: 'Template saved.' });
        return;
      }
    } catch (e) {
      // fallthrough to local save
    }
    // fallback to local-only save
    try {
      const raw = localStorage.getItem('bottomAdTemplates');
      const list = raw ? JSON.parse(raw) : [];
      const localTpl = { id: Date.now(), ...tpl };
      list.unshift(localTpl);
      localStorage.setItem('bottomAdTemplates', JSON.stringify(list));
      setBottomAdTemplates(list);
      setToast({ type: 'success', title: 'Saved', message: 'Template saved locally.' });
    } catch (e) {
      setToast({ type: 'error', title: 'Save failed', message: 'Could not save template.' });
    }
  };

  const updateBottomAdTemplate = async (id, updated) => {
    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/templates/bottom/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
      if (res.ok) {
        const j = await res.json();
        const list = (bottomAdTemplates || []).map(t => t.id === id ? j.template : t);
        setBottomAdTemplates(list);
        localStorage.setItem('bottomAdTemplates', JSON.stringify(list));
        setToast({ type: 'success', title: 'Updated', message: 'Template updated.' });
        setEditingBottomTemplate(null);
        return;
      }
    } catch (e) {
      // ignore
    }
    // local update fallback
    const list = (bottomAdTemplates || []).map(t => t.id === id ? { ...t, ...updated } : t);
    setBottomAdTemplates(list);
    localStorage.setItem('bottomAdTemplates', JSON.stringify(list));
    setToast({ type: 'success', title: 'Updated', message: 'Template updated locally.' });
    setEditingBottomTemplate(null);
  };

  const deleteBottomAdTemplate = async (id) => {
    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/templates/bottom/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const list = (bottomAdTemplates || []).filter(t => t.id !== id);
        setBottomAdTemplates(list);
        localStorage.setItem('bottomAdTemplates', JSON.stringify(list));
        setToast({ type: 'success', title: 'Deleted', message: 'Template deleted.' });
        return;
      }
    } catch (e) {
      // ignore
    }
    const list = (bottomAdTemplates || []).filter(t => t.id !== id);
    setBottomAdTemplates(list);
    localStorage.setItem('bottomAdTemplates', JSON.stringify(list));
    setToast({ type: 'success', title: 'Deleted', message: 'Template deleted locally.' });
  };

  const applyTemplate = (tpl) => {
    if (!tpl) return;
    setBottomAdProfileName(tpl.name || '');
    setBottomAdProfileAvatar(tpl.avatar || '');
    if (tpl.textItems && tpl.textItems.length > 0) {
      setBottomAdTextItems(tpl.textItems);
      setBottomAdTextInterval(tpl.textInterval || 5000);
      setBottomAdTextAnimation(tpl.textAnimation || 'fade');
      setBottomAdCardAnimation(tpl.cardAnimation || 'fade');
      setBottomAdCardEffect(tpl.cardEffect || 'none');
      setBottomAdCardExitAnimation(tpl.cardExitAnimation || 'fadeOut');
      setBottomAdBorderColor(tpl.borderColor || 'rgba(255, 0, 255, 0.6)');
    } else {
      setBottomAdText(tpl.text || '');
    }
    setBottomAdLink(tpl.link || '');
    setAdAssets(tpl.assets || []);
    setShowTemplatesModal(false);
    setToast({ type: 'success', title: 'Applied', message: `Template "${tpl.name || 'Untitled'}" loaded into form fields.` });
  };

  // Function to remove ads from a video
  const handleRemoveAdsFromVideo = async (videoId, adType, adId = null) => {
    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/remove-ad-from-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession?.id,
          videoId: videoId,
          adType: adType, // 'bottom', 'overlay', or 'all'
          adId: adId // specific ad ID if removing individual ad
        })
      });

      if (res.ok) {
        const msg = adId ? `Ad removed` : `All ${adType} ads removed`;
        setToast({ type: 'success', title: 'Removed', message: msg });
        // Reload data but keep modal open
        if (staffSession) {
          loadData(staffSession);
          // Refresh selectedVideoForAdMgmt after a short delay to show updated data
          setTimeout(() => {
            const updatedVideo = videos.find(v => v.id === videoId);
            if (updatedVideo) {
              setSelectedVideoForAdMgmt(updatedVideo);
            }
          }, 500);
        }
      } else {
        setToast({ type: 'error', title: 'Failed', message: 'Unable to remove ads.' });
      }
    } catch (err) {
      console.error('Remove ads failed:', err);
      setToast({ type: 'error', title: 'Error', message: 'Error removing ads.' });
    }
  };

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);
  
  
  // Modal states
  const [actionModal, setActionModal] = useState({ isOpen: false, itemId: null, itemType: null });
  const [undoModal, setUndoModal] = useState({ isOpen: false, action: null, itemId: null, itemType: null });
  const [reasonModal, setReasonModal] = useState({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' });
  const [userActionModal, setUserActionModal] = useState({ isOpen: false, userId: null, action: null });
  const [promotionModal, setPromotionModal] = useState({ isOpen: false, title: '', message: '', recipientType: 'individual', selectedUsers: [], promotionType: 'offer', ctaText: 'Learn More', ctaIcon: 'gift', ctaColor: '#f59e0b', ctaUrl: '' });
  const [ctaPickerOpen, setCtaPickerOpen] = useState(false);
  const [promoTemplates, setPromoTemplates] = useState(() => {
    try {
      const raw = localStorage.getItem('promoTemplates');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  });
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  // Persist templates when changed
  useEffect(() => {
    try {
      localStorage.setItem('promoTemplates', JSON.stringify(promoTemplates || []));
    } catch (e) { /* Ignore storage errors */ }
  }, [promoTemplates]);
  const [selectedActionType, setSelectedActionType] = useState(null);
  const [notificationPreview, setNotificationPreview] = useState(null);
  const [promotionSearch, setPromotionSearch] = useState('');
  const [showPromotionFilters, setShowPromotionFilters] = useState(false);
  const [creatorOnlyFilter, setCreatorOnlyFilter] = useState(false);
  const [usersOnlyFilter, setUsersOnlyFilter] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [minRequestsFilter, setMinRequestsFilter] = useState('');
  const [minPerRequestFilter, setMinPerRequestFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('all'); // all, hasplan, noplan
  const [requestActivityFilter, setRequestActivityFilter] = useState('all'); // all, created, fulfilled, free, none
  const [daysActiveFilter, setDaysActiveFilter] = useState(''); // min days since last activity
  const [userMetrics, setUserMetrics] = useState({});
  // New filters for request quality
  const [submittedRequestsFilter, setSubmittedRequestsFilter] = useState('all'); // all, free, paid, mixed
  const [fulfilledRequestsFilter, setFulfilledRequestsFilter] = useState('all'); // all, free, paid, mixed
  const [maxAvgRequestAmount, setMaxAvgRequestAmount] = useState('');
  
  // Category tabs matching home page
  const CATEGORY_TABS = ['Travel', 'Education', 'Entertainment', 'Music', 'Sports', 'Gaming', 'Tech', 'Lifestyle', 'Food', 'Fashion', 'Art', 'Science', 'Health', 'Business', 'Comedy', 'News', 'Other'];

  // Derived lists for promotion modal filtering
  const filteredUsersForPromotion = users.filter((u) => {
    const s = (promotionSearch || '').trim().toLowerCase();
    if (creatorOnlyFilter && !u.isCreator) return false;
    if (usersOnlyFilter && u.isCreator) return false;
    if (categoryFilter !== 'all' && u.creatorCategory !== categoryFilter) return false;
    if (minRequestsFilter && Number(u.requestCount || 0) < Number(minRequestsFilter)) return false;
    if (minPerRequestFilter && Number(u.avgPerRequest || 0) < Number(minPerRequestFilter)) return false;
    
    // Advanced filters using metrics
    const metrics = userMetrics[u.id];
    if (metrics) {
      if (planFilter === 'hasplan' && !metrics.hasPlan) return false;
      if (planFilter === 'noplan' && metrics.hasPlan) return false;
      
      if (requestActivityFilter === 'created' && metrics.createdRequestsCount === 0) return false;
      if (requestActivityFilter === 'fulfilled' && metrics.fulfilledRequestsCount === 0) return false;
      if (requestActivityFilter === 'free' && metrics.freeRequestsCount === 0) return false;
      if (requestActivityFilter === 'none' && metrics.totalRequestsEngagement > 0) return false;
      
      if (daysActiveFilter && metrics.daysSinceLastActivity > Number(daysActiveFilter)) return false;
    }
    
    if (!s) return true;
    return ((u.name || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s) || (String(u.id) || '').toLowerCase().includes(s));
  });
  const [banType, setBanType] = useState('permanent');
  const [banDuration, setBanDuration] = useState({ value: 7, unit: 'days' });
  const [promotionTypeDropdown, setPromotionTypeDropdown] = useState(false);
  const [sendToDropdown, setSendToDropdown] = useState(false);
  
  // User action feedback state - tracks last action applied to users
  const [userActionFeedback, setUserActionFeedback] = useState({
    isVisible: false,
    userId: null,
    userName: null,
    action: null,
    reason: null,
    timestamp: null
  });
  
  // Search and scroll states
  const [videoSearch, setVideoSearch] = useState('');
  const [requestSearch, setRequestSearch] = useState('');
  const [commentSearch, setCommentSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [reportSearch, setReportSearch] = useState('');
  const [creatorSearch, setCreatorSearch] = useState('');
  const [shadowDeletedSearch, setShadowDeletedSearch] = useState('');
  const [approvalsSearch, setApprovalsSearch] = useState('');
  const [requestAccentColorSelection, setRequestAccentColorSelection] = useState(() => {
    try {
      const saved = localStorage.getItem('requestAccentColorSelection');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }); // Track which requests have accent color enabled (persisted to localStorage)
  const [approvalModal, setApprovalModal] = useState({ isOpen: false, account: null, permissions: {}, grantAdmin: false });
  const [staffMembers, setStaffMembers] = useState([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [editingStaffMember, setEditingStaffMember] = useState(null);
  const [staffPermissionsModal, setStaffPermissionsModal] = useState({ isOpen: false, member: null, permissions: {}, grantAdmin: false, blocked: false });
  const [denyModal, setDenyModal] = useState({ isOpen: false, account: null, selectedReason: '', customMessage: '' });
  const [approvalInstructionsModal, setApprovalInstructionsModal] = useState({ isOpen: false, account: null, permissions: {}, grantAdmin: false, instructions: '' });
  const [staffProfileModal, setStaffProfileModal] = useState({ 
    isOpen: false, 
    showPasswordChange: false, 
    name: '', 
    email: '', 
    currentPasswords: ['', '', ''],
    newPassword1: '',
    newPassword2: '',
    newPassword3: '',
    showPassword1: false,
    showPassword2: false,
    showPassword3: false,
    showCurrentPassword1: false,
    showCurrentPassword2: false,
    showCurrentPassword3: false
  });
  const [accessDeniedModal, setAccessDeniedModal] = useState({ isOpen: false, pageName: '' });
  const [myProfileEdit, setMyProfileEdit] = useState({ name: '', email: '', newPassword: '', confirmPassword: '', showPasswordChange: false, isEditing: false });

  // All available permissions for staff
  const ALL_PERMISSIONS = {
    videos: 'Videos',
    requests: 'Requests',
    comments: 'Comments',
    reports: 'Report Queue',
    users: 'Users',
    creators: 'Creators',
    shadowDeleted: 'Shadow Deleted',
    approvals: 'Account Approvals',
    staffManagement: 'Manage Staff',
    promotions: 'Promotions'
  };

  // Helper function to check if staff has permission for a page
  const hasPermission = (permKey) => {
    // Administrators always have all permissions
    if (staffSession?.role === 'administrator') return true;
    // If permissions not set, default to true (backwards compatibility)
    if (!staffSession?.permissions) return true;
    // Check specific permission - if not explicitly false, allow
    return staffSession.permissions[permKey] !== false;
  };

  // Helper function to navigate to tab with permission check
  const navigateToTab = (tabName, permKey, displayName) => {
    if (!hasPermission(permKey)) {
      setAccessDeniedModal({ isOpen: true, pageName: displayName || ALL_PERMISSIONS[permKey] || tabName });
      return;
    }
    setActiveTab(tabName);
    setShowDropdown(false);
  };

  const [collapsedCreators, setCollapsedCreators] = useState(new Set());
  const [collapsedUsers, setCollapsedUsers] = useState(new Set());
  const [collapsedReports, setCollapsedReports] = useState(new Set());
  const [savedScrollPositions, setSavedScrollPositions] = useState({});
  const [footerPosition, setFooterPosition] = useState({ x: 0, y: 0 });
  const [isDraggingFooter, setIsDraggingFooter] = useState(false);
  const [footerDragStart, setFooterDragStart] = useState({ x: 0, y: 0 });
  const [previewingOverlay, setPreviewingOverlay] = useState(null);
  const [deviceOrientation, setDeviceOrientation] = useState('portrait');
  const [showPreviewSaveModal, setShowPreviewSaveModal] = useState(false);
  const [templates, setTemplates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('overlayTemplates') || '[]');
    } catch (e) { return []; }
  });
  const [templateName, setTemplateName] = useState('');
  const [templatePanelOpen, setTemplatePanelOpen] = useState(null);
  const [selectedVideosForApply, setSelectedVideosForApply] = useState([]);
  const [applyPlacement, setApplyPlacement] = useState('beginning');
  // Bottom ads apply state
  const [showBottomApplyModal, setShowBottomApplyModal] = useState(false);
  const [bottomApplyVideoSearch, setBottomApplyVideoSearch] = useState('');
  const [bottomApplyStartTime, setBottomApplyStartTime] = useState(0);
  const [bottomApplyDuration, setBottomApplyDuration] = useState(30);
  const [bottomApplyDisplayCount, setBottomApplyDisplayCount] = useState(1); // Max number of times to display ad
  const [bottomApplySelectedVideos, setBottomApplySelectedVideos] = useState([]);

  // Track scroll position per tab
  useEffect(() => {
    const handleScroll = () => {
      setSavedScrollPositions(prev => ({
        ...prev,
        [activeTab]: window.scrollY
      }));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  // Footer drag handling
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingFooter) {
        setFooterPosition({
          x: e.clientX - footerDragStart.x,
          y: e.clientY - footerDragStart.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingFooter(false);
    };

    if (isDraggingFooter) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingFooter, footerDragStart]);

  // Keep footer inside the viewport so buttons never get clipped by dragging or resize
  useEffect(() => {
    const clampFooterIntoView = () => {
      try {
        const maxX = Math.max(0, window.innerWidth - 320); // footer has minWidth ~300
        const maxY = Math.max(0, window.innerHeight - 40); // keep bottom within visible area
        setFooterPosition((prev) => {
          const nx = Math.min(Math.max(0, prev.x), maxX);
          const ny = Math.min(Math.max(0, prev.y), maxY);
          if (nx !== prev.x || ny !== prev.y) return { x: nx, y: ny };
          return prev;
        });
      } catch (e) {
        // defensive: ignore during SSR or when window not available
      }
    };

    // clamp on mount and when window resizes
    clampFooterIntoView();
    window.addEventListener('resize', clampFooterIntoView);
    return () => window.removeEventListener('resize', clampFooterIntoView);
  }, []);

  useEffect(() => {
    const session = localStorage.getItem('staffSession');
    if (session) {
      setStaffSession(JSON.parse(session));
      loadData(JSON.parse(session));
    }
  }, []);


  // Video playback animation
  useEffect(() => {
    if (!videoPreviewState.isPlaying) return;

    const interval = setInterval(() => {
      setVideoPreviewState(prev => {
        const selectedVideo = videos.find(v => v.id === selectedAdVideo);
        const duration = selectedVideo?.duration || 100;
        const newTime = prev.currentTime + 0.033; // ~30fps
        
        // Stop at end
        if (newTime >= duration) {
          return { ...prev, currentTime: duration, isPlaying: false };
        }
        return { ...prev, currentTime: newTime };
      });
    }, 33); // 33ms ≈ 30fps

    return () => clearInterval(interval);
  }, [videoPreviewState.isPlaying, selectedAdVideo, videos]);

  // Apply preview overlay to editor and optionally save as template
  const saveAndApplyPreview = (saveAsTemplate = true) => {
    if (!previewingOverlay) return;

    // Apply overlay values to the main editor preview state
    setVideoPreviewState(prev => ({
      ...prev,
      overlayPosition: { x: previewingOverlay.x, y: previewingOverlay.y },
      overlaySize: { width: previewingOverlay.width, height: previewingOverlay.height }
    }));

    // Optionally save template
    if (saveAsTemplate) {
      const newTemplate = {
        id: Date.now(),
        name: templateName && templateName.trim() ? templateName.trim() : `Template ${templates.length + 1}`,
        overlay: { ...previewingOverlay }
      };
      setTemplates(prev => [newTemplate, ...prev]);
      setTemplateName('');
    }

    // Close the preview modal and the save dialog
    setShowOverlayPreview(false);
    setShowPreviewSaveModal(false);
  };

  // Apply a saved template to one or more videos (UI-level only)
  const applyTemplateToVideos = (templateId, videoIds = [], placement = 'beginning') => {
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;

    // Ask about Google AdSense placement note
    const ok = window.confirm('Applying overlays at specific positions (beginning/end) may affect monetization. Ensure Google AdSense/YouTube policies allow this. Proceed?');
    if (!ok) return;

    // Update local videos state to tag template application (frontend only)
    setVideos(prev => prev.map(v => {
      if (!videoIds.includes(v.id)) return v;
      const applied = v.appliedTemplates ? [...v.appliedTemplates] : [];
      applied.push({ templateId: tpl.id, placement });
      return { ...v, appliedTemplates: applied };
    }));

    // Optionally you would POST to server here to persist across users
    alert(`Applied template "${tpl.name}" to ${videoIds.length} video(s) at ${placement}.`);
  };

  // Sync video element with current time
  useEffect(() => {
    const videoElement = document.querySelector('[data-video-preview]');
    if (videoElement) {
      videoElement.currentTime = videoPreviewState.currentTime;
      if (videoPreviewState.isPlaying) {
        videoElement.play().catch(() => {});
      } else {
        videoElement.pause();
      }
    }
  }, [videoPreviewState.currentTime, videoPreviewState.isPlaying]);

  // Persist templates to localStorage
  useEffect(() => {
    try { localStorage.setItem('overlayTemplates', JSON.stringify(templates)); } catch (e) {
      // Ignore localStorage errors
    }
  }, [templates]);

  // Handle screen orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      setDeviceOrientation(isLandscape ? 'landscape' : 'portrait');
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    // Set initial orientation
    handleOrientationChange();

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  const loadData = async (employee) => {
    try {
      setLoading(true);
      setError('');

      // Load staff notifications
      const notificationsRes = await fetch(`${getStaffBackendBaseUrl()}/staff/notifications?employeeId=${employee.id}`);
      if (notificationsRes.ok) {
        const data = await notificationsRes.json();
        setStaffNotifications(data.notifications || []);
      }

      // Load reports
      const reportsRes = await fetch(`${getStaffBackendBaseUrl()}/staff/reports?employeeId=${employee.id}`);
      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(data.reports || []);
      }

      // Load videos
      const videosRes = await fetch(`${getStaffBackendBaseUrl()}/staff/videos?employeeId=${employee.id}`);
      if (videosRes.ok) {
        const data = await videosRes.json();
        // Parse time string to duration in seconds
        const videosWithDuration = (data.videos || []).map(v => ({
          ...v,
          duration: v.duration || parseDurationToSeconds(v.time)
        }));
        setVideos(videosWithDuration);
      }

      // Load users
      const usersRes = await fetch(`${getStaffBackendBaseUrl()}/staff/users?employeeId=${employee.id}`);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
        // Also extract creators from users
        const creatorsOnly = (data.users || []).filter(u => u.isCreator);
        setCreators(creatorsOnly);
      }

      // Load user activity metrics for promotion filtering
      const metricsRes = await fetch(`${getStaffBackendBaseUrl()}/staff/user-metrics?employeeId=${employee.id}`);
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        const metricsMap = {};
        (data.metrics || []).forEach(m => {
          metricsMap[m.id] = m;
        });
        setUserMetrics(metricsMap);
      }

      // Load requests
      const requestsRes = await fetch(`${getStaffBackendBaseUrl()}/staff/requests?employeeId=${employee.id}`);
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setRequests(data.requests || []);
      }

      // Load comments
      const commentsRes = await fetch(`${getStaffBackendBaseUrl()}/staff/comments?employeeId=${employee.id}`);
      if (commentsRes.ok) {
        const data = await commentsRes.json();
        setComments(data.comments || []);
      }

      // Load support tickets
      const supportRes = await fetch(`${getStaffBackendBaseUrl()}/support/tickets?employeeId=${employee.id}`);
      if (supportRes.ok) {
        const data = await supportRes.json();
        console.log('Support tickets loaded:', data.tickets?.length || 0);
        setSupportTickets(data.tickets || []);
      } else {
        const errorText = await supportRes.text();
        console.error('Support tickets fetch failed:', supportRes.status, errorText);
      }

      // Load onboarding info
      const onboardingRes = await fetch(`${getStaffBackendBaseUrl()}/staff/onboarding-info?employeeId=${employee.id}`);
      if (onboardingRes.ok) {
        const data = await onboardingRes.json();
        setOnboardingList(data.onboardingInfo || []);
      }

      // Load pending accounts (admin only)
      if (employee.role === 'administrator') {
        const pendingRes = await fetch(`${getStaffBackendBaseUrl()}/staff/pending-accounts?employeeId=${employee.id}`);
        if (pendingRes.ok) {
          const data = await pendingRes.json();
          setPendingAccounts(data.pendingAccounts || []);
        }

        // Load staff members (admin only)
        const staffRes = await fetch(`${getStaffBackendBaseUrl()}/staff/all?employeeId=${employee.id}`);
        if (staffRes.ok) {
          const data = await staffRes.json();
          setStaffMembers(data.members || []);
        }
      }
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Parse time string like "3:10" to seconds
  const parseDurationToSeconds = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
  };

  const handleApproveAccount = async (account, approve) => {
    if (!account) return;
    
    console.log(`Click registered: ${approve ? 'Approve' : 'Deny'} for ${account.name}`);
    
    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/approve-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          pendingId: account.employeeId,
          approve: approve,
          denialReason: approve ? null : 'Application denied by staff'
        })
      });

      if (res.ok) {
        setPendingAccounts(pendingAccounts.filter(p => p.employeeId !== account.employeeId));
        setToast({ 
          type: 'success', 
          message: approve ? `Account approved for ${account.name}` : `Account denied for ${account.name}` 
        });
      } else {
        setToast({ type: 'error', message: `Failed to ${approve ? 'approve' : 'deny'} account` });
      }
    } catch (err) {
      console.error(`${approve ? 'Approval' : 'Denial'} failed:`, err);
      setToast({ type: 'error', message: `Failed to ${approve ? 'approve' : 'deny'} account` });
    }
  };

  const handleConfirmApproval = async () => {
    if (!approvalInstructionsModal.account) return;

    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/approve-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          pendingId: approvalInstructionsModal.account.employeeId,
          approve: true,
          permissions: approvalInstructionsModal.permissions,
          grantAdminAccess: approvalInstructionsModal.grantAdmin,
          approvalInstructions: approvalInstructionsModal.instructions
        })
      });

      if (res.ok) {
        const result = await res.json();
        setPendingAccounts(pendingAccounts.filter(p => p.employeeId !== approvalInstructionsModal.account.employeeId));
        setApprovalInstructionsModal({ isOpen: false, account: null, permissions: {}, grantAdmin: false, instructions: '' });
        setToast({ 
          type: 'success', 
          message: `Account approved for ${approvalInstructionsModal.account.name}! Employee ID: ${result.employeeId}` 
        });
      }
    } catch (err) {
      console.error('Approval failed:', err);
      setToast({ type: 'error', message: 'Failed to approve account' });
    }
  };

  const handleConfirmDenial = async () => {
    // Check if either a preset reason is selected OR a custom message is provided
    const hasReason = denyModal.selectedReason.trim() || denyModal.customMessage.trim();
    
    if (!denyModal.account || !hasReason) {
      setToast({ type: 'error', message: 'Please select or provide a denial reason' });
      return;
    }

    try {
      const finalMessage = denyModal.customMessage.trim() || denyModal.selectedReason;

      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/approve-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          pendingId: denyModal.account.employeeId,
          approve: false,
          denialReason: finalMessage
        })
      });

      if (res.ok) {
        setPendingAccounts(pendingAccounts.filter(p => p.employeeId !== denyModal.account.employeeId));
        setDenyModal({ isOpen: false, account: null, selectedReason: '', customMessage: '' });
        setToast({ type: 'success', message: `Account denied for ${denyModal.account.name}` });
      }
    } catch (err) {
      console.error('Denial failed:', err);
      setToast({ type: 'error', message: 'Failed to deny account' });
    }
  };

  const togglePermission = (permission) => {
    setApprovalInstructionsModal(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission]
      }
    }));
  };

  const setAllPermissions = (value) => {
    setApprovalInstructionsModal(prev => ({
      ...prev,
      permissions: {
        videos: value,
        requests: value,
        comments: value,
        reports: value,
        users: value,
        creators: value,
        shadowDeleted: value,
        approvals: value,
        promotions: value,
        templates: value,
        ads: value
      }
    }));
  };

  const handleEditMyProfile = () => {
    setMyProfileEdit({
      name: staffSession?.name || '',
      email: staffSession?.email || '',
      newPassword: '',
      confirmPassword: '',
      showPasswordChange: false,
      isEditing: true
    });
  };

  const handleSaveMyProfile = async () => {
    if (!myProfileEdit.name.trim() || !myProfileEdit.email.trim()) {
      setToast({ type: 'error', message: 'Name and email are required' });
      return;
    }

    if (!myProfileEdit.email.includes('@')) {
      setToast({ type: 'error', message: 'Invalid email address' });
      return;
    }

    if (myProfileEdit.showPasswordChange) {
      if (!myProfileEdit.newPassword || !myProfileEdit.confirmPassword) {
        setToast({ type: 'error', message: 'Please enter both passwords' });
        return;
      }

      if (myProfileEdit.newPassword !== myProfileEdit.confirmPassword) {
        setToast({ type: 'error', message: 'Passwords do not match' });
        return;
      }
    }

    try {
      const updateData = {
        employeeId: staffSession?.id,
        name: myProfileEdit.name,
        email: myProfileEdit.email
      };

      if (myProfileEdit.showPasswordChange && myProfileEdit.newPassword) {
        updateData.newPassword = myProfileEdit.newPassword;
      }

      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/update-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        const updatedEmployee = { ...staffSession, name: myProfileEdit.name, email: myProfileEdit.email };
        setStaffSession(updatedEmployee);
        localStorage.setItem('staffSession', JSON.stringify(updatedEmployee));
        setMyProfileEdit({
          name: myProfileEdit.name,
          email: myProfileEdit.email,
          newPassword: '',
          confirmPassword: '',
          showPasswordChange: false,
          isEditing: false
        });
        setToast({ type: 'success', message: 'Profile updated successfully' });
      } else {
        const data = await res.json();
        setToast({ type: 'error', message: data.error || 'Failed to update profile' });
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setToast({ type: 'error', message: 'Connection error' });
    }
  };

  const handleCancelEdit = () => {
    setMyProfileEdit({
      name: staffSession?.name || '',
      email: staffSession?.email || '',
      newPassword: '',
      confirmPassword: '',
      showPasswordChange: false,
      isEditing: false
    });
  };

  const handleDeleteVideo = async (videoId) => {
    const reason = reasonModal.reason.trim();
    if (!reason) {
      setError('Please enter a reason');
      return;
    }

    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/delete-video/${videoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          reason
        })
      });

      if (res.ok) {
        // Keep video in list but mark it as deleted for undo display
        setVideos(videos.map(v => v.id === videoId ? { ...v, deleted: true, deletedReason: reason, deletedBy: staffSession.id, deletedAt: new Date().toISOString() } : v));
        setReasonModal({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' });
        setError('');
        setToast({ type: 'success', message: 'Video deleted' });
      } else {
        setError('Failed to delete video');
        setToast({ type: 'error', message: 'Failed to delete video' });
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Error deleting video');
    }
  };

  const handleHideVideo = async (videoId) => {
    const reason = reasonModal.reason.trim();
    if (!reason) {
      setError('Please enter a reason');
      return;
    }

    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/hide-video/${videoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          reason
        })
      });

      if (res.ok) {
        // Keep video in list but mark it as hidden for undo display
        setVideos(videos.map(v => v.id === videoId ? { ...v, hidden: true, hiddenReason: reason, hiddenBy: staffSession.id, hiddenAt: new Date().toISOString() } : v));
        setReasonModal({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' });
        setError('');
        setToast({ type: 'success', message: 'Video hidden' });
      } else {
        setError('Failed to hide video');
        setToast({ type: 'error', message: 'Failed to hide video' });
      }
    } catch (err) {
      console.error('Hide failed:', err);
      setError('Error hiding video');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    const reason = reasonModal.reason.trim();
    if (!reason) {
      setError('Please enter a reason');
      return;
    }

    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/delete-request/${requestId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          reason
        })
      });

      if (res.ok) {
        // Keep request in list but mark it as deleted for undo display
        setRequests(requests.map(r => r.id === requestId ? { ...r, deleted: true, deletedReason: reason, deletedBy: staffSession.id, deletedAt: new Date().toISOString() } : r));
        setReasonModal({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' });
        setError('');
        setToast({ type: 'success', message: 'Request deleted' });
      } else {
        setError('Failed to delete request');
        setToast({ type: 'error', message: 'Failed to delete request' });
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Error deleting request');
    }
  };

  const handleHideRequest = async (requestId) => {
    const reason = reasonModal.reason.trim();
    if (!reason) {
      setError('Please enter a reason');
      return;
    }

    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/hide-request/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          reason
        })
      });

      if (res.ok) {
        // Keep request in list but mark it as hidden for undo display
        setRequests(requests.map(r => r.id === requestId ? { ...r, hidden: true, hiddenReason: reason, hiddenBy: staffSession.id, hiddenAt: new Date().toISOString() } : r));
        setReasonModal({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' });
        setError('');
        setToast({ type: 'success', message: 'Request hidden' });
      } else {
        setError('Failed to hide request');
        setToast({ type: 'error', message: 'Failed to hide request' });
      }
    } catch (err) {
      console.error('Hide failed:', err);
      setError('Error hiding request');
    }
  };

  const handleDeleteComment = async (commentId) => {
    const reason = reasonModal.reason.trim();
    if (!reason) {
      setError('Please enter a reason');
      return;
    }

    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/delete-comment/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          reason
        })
      });

      if (res.ok) {
        // Keep comment in list but mark it as deleted for undo display
        setComments(comments.map(c => c.id === commentId ? { ...c, deleted: true, deletedReason: reason, deletedBy: staffSession.id, deletedAt: new Date().toISOString() } : c));
        setReasonModal({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' });
        setError('');
        setToast({ type: 'success', message: 'Comment deleted' });
      } else {
        setError('Failed to delete comment');
        setToast({ type: 'error', message: 'Failed to delete comment' });
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Error deleting comment');
    }
  };

  const handleHideComment = async (commentId) => {
    const reason = reasonModal.reason.trim();
    if (!reason) {
      setError('Please enter a reason');
      return;
    }

    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/hide-comment/${commentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          reason
        })
      });

      if (res.ok) {
        // Keep comment in list but mark it as hidden for undo display
        setComments(comments.map(c => c.id === commentId ? { ...c, hidden: true, hiddenReason: reason, hiddenBy: staffSession.id, hiddenAt: new Date().toISOString() } : c));
        setReasonModal({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' });
        setError('');
        setToast({ type: 'success', message: 'Comment hidden' });
      } else {
        setError('Failed to hide comment');
        setToast({ type: 'error', message: 'Failed to hide comment' });
      }
    } catch (err) {
      console.error('Hide failed:', err);
      setError('Error hiding comment');
    }
  };

  // Undo handlers
  const handleUndoHideVideo = async (videoId) => {
    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/undo-hide-video/${videoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id
        })
      });

      if (res.ok) {
        setVideos(videos.map(v => v.id === videoId ? { ...v, hidden: false, hiddenReason: null, hiddenBy: null, hiddenAt: null } : v));
        setUndoModal({ isOpen: false, action: null, itemId: null, itemType: null });
        setError('');
        setToast({ type: 'success', message: 'Video unhidden' });
      } else {
        setError('Failed to undo hide');
        setToast({ type: 'error', message: 'Failed to undo hide' });
      }
    } catch (err) {
      console.error('Undo hide failed:', err);
      setError('Error undoing hide');
    }
  };

  const handleUndoDeleteVideo = async (videoId) => {
    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/undo-delete-video/${videoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id
        })
      });

      if (res.ok) {
        setVideos(videos.map(v => v.id === videoId ? { ...v, deleted: false, deletedReason: null, deletedBy: null, deletedAt: null } : v));
        setUndoModal({ isOpen: false, action: null, itemId: null, itemType: null });
        setError('');
        setToast({ type: 'success', message: 'Video restored' });
      } else {
        setError('Failed to undo delete');
        setToast({ type: 'error', message: 'Failed to undo delete' });
      }
    } catch (err) {
      console.error('Undo delete failed:', err);
      setError('Error undoing delete');
    }
  };

  // Request undo handlers
  const handleUndoHideRequest = async (requestId) => {
    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/undo-hide-request/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id
        })
      });

      if (res.ok) {
        setRequests(requests.map(r => r.id === requestId ? { ...r, hidden: false, hiddenReason: null, hiddenBy: null, hiddenAt: null } : r));
        setUndoModal({ isOpen: false, action: null, itemId: null, itemType: null });
        setError('');
        setToast({ type: 'success', message: 'Request unhidden' });
      } else {
        setError('Failed to undo hide');
        setToast({ type: 'error', message: 'Failed to undo hide' });
      }
    } catch (err) {
      console.error('Undo hide failed:', err);
      setError('Error undoing hide');
    }
  };

  const handleUndoDeleteRequest = async (requestId) => {
    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/undo-delete-request/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id
        })
      });

      if (res.ok) {
        setRequests(requests.map(r => r.id === requestId ? { ...r, deleted: false, deletedReason: null, deletedBy: null, deletedAt: null } : r));
        setUndoModal({ isOpen: false, action: null, itemId: null, itemType: null });
        setError('');
        setToast({ type: 'success', message: 'Request restored' });
      } else {
        setError('Failed to undo delete');
        setToast({ type: 'error', message: 'Failed to undo delete' });
      }
    } catch (err) {
      console.error('Undo delete failed:', err);
      setError('Error undoing delete');
    }
  };

  // Comment undo handlers
  const handleUndoHideComment = async (commentId) => {
    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/undo-hide-comment/${commentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id
        })
      });

      if (res.ok) {
        setComments(comments.map(c => c.id === commentId ? { ...c, hidden: false, hiddenReason: null, hiddenBy: null, hiddenAt: null } : c));
        setUndoModal({ isOpen: false, action: null, itemId: null, itemType: null });
        setError('');
        setToast({ type: 'success', message: 'Comment unhidden' });
      } else {
        setError('Failed to undo hide');
        setToast({ type: 'error', message: 'Failed to undo hide' });
      }
    } catch (err) {
      console.error('Undo hide failed:', err);
      setError('Error undoing hide');
    }
  };

  const handleUndoDeleteComment = async (commentId) => {
    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/undo-delete-comment/${commentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id
        })
      });

      if (res.ok) {
        setComments(comments.map(c => c.id === commentId ? { ...c, deleted: false, deletedReason: null, deletedBy: null, deletedAt: null } : c));
        setUndoModal({ isOpen: false, action: null, itemId: null, itemType: null });
        setError('');
        setToast({ type: 'success', message: 'Comment restored' });
      } else {
        setError('Failed to undo delete');
        setToast({ type: 'error', message: 'Failed to undo delete' });
      }
    } catch (err) {
      console.error('Undo delete failed:', err);
      setError('Error undoing delete');
    }
  };

  const handleUserAction = async (action) => {
    const reason = reasonModal.reason.trim();
    if (!reason) {
      setError('Please enter a reason');
      return;
    }

    try {
      const payload = {
        employeeId: staffSession.id,
        action: action,
        reason,
        ...(action === 'ban' && {
          banType: banType,
          banDuration: banType === 'temporary' ? banDuration : null
        })
      };
      
      console.log('Sending user action request:', {
        url: `${getStaffBackendBaseUrl()}/staff/user-action/${userActionModal.userId}`,
        payload
      });

      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/user-action/${userActionModal.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('User action response status:', res.status);

      if (res.ok) {
        const responseData = await res.json();
        const actionedUser = responseData.user;
        
        // Show immediate feedback card
        setUserActionFeedback({
          isVisible: true,
          userId: userActionModal.userId,
          userName: actionedUser.name,
          action: action,
          reason: reason,
          timestamp: new Date()
        });

        // Close modals
        setUserActionModal({ isOpen: false, userId: null, action: null });
        setReasonModal({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' });
        setSelectedActionType(null);
        setNotificationPreview(null);
        setBanType('permanent');
        setBanDuration({ value: 7, unit: 'days' });
        setError('');

        // Reload data to reflect changes
        if (staffSession) loadData(staffSession);

        // Auto-hide feedback after 8 seconds (allows time for undo)
        setTimeout(() => {
          setUserActionFeedback({ isVisible: false, userId: null, userName: null, action: null, reason: null, timestamp: null });
        }, 8000);
      } else {
        const errorData = await res.json();
        console.error('User action error response:', errorData);
        setError('Failed to apply user action');
        setToast({ type: 'error', message: 'Failed to apply user action' });
      }
    } catch (err) {
      console.error('User action failed:', err);
      setError('Error applying user action');
      setToast({ type: 'error', message: 'Error applying user action' });
    }
  };

  const handleUndoUserAction = async () => {
    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/undo-user-action/${userActionFeedback.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          action: userActionFeedback.action
        })
      });

      if (res.ok) {
        // Hide feedback card and reload data
        setUserActionFeedback({ isVisible: false, userId: null, userName: null, action: null, reason: null, timestamp: null });
        setToast({ type: 'success', message: `${userActionFeedback.action} action undone` });
        
        // Reload data to reflect changes
        if (staffSession) loadData(staffSession);
      } else {
        setToast({ type: 'error', message: 'Failed to undo action' });
      }
    } catch (err) {
      console.error('Undo user action failed:', err);
      setToast({ type: 'error', message: 'Error undoing action' });
    }
  };

  const handleSendPromotion = async () => {
    if (!promotionModal.title.trim() || !promotionModal.message.trim()) {
      setError('Please fill in all promotion fields');
      return;
    }

    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/send-promotion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          title: promotionModal.title,
          message: promotionModal.message,
          promotionType: promotionModal.promotionType,
          recipientType: promotionModal.recipientType,
          selectedUsers: promotionModal.recipientType === 'individual' ? promotionModal.selectedUsers : null,
          ctaText: promotionModal.ctaText,
          ctaIcon: promotionModal.ctaIcon,
          ctaColor: promotionModal.ctaColor,
          ctaUrl: promotionModal.ctaUrl
        })
      });

      if (res.ok) {
        const data = await res.json();
        setError('');
        // Save this promotion as a template (avoid exact duplicates)
        try {
          const candidate = { id: Date.now(), title: promotionModal.title.trim(), message: promotionModal.message.trim() };
          const exists = promoTemplates.some(t => t.title === candidate.title && t.message === candidate.message);
          if (!exists) setPromoTemplates(prev => [candidate, ...(prev || [])].slice(0, 25));
        } catch (e) { /* Ignore template save errors */ }
        // Keep the modal open (do not auto-close) so staff can send more or edit
        // Provide success toast and keep current fields
        const delivered = data.created || (promotionModal.selectedUsers ? promotionModal.selectedUsers.length : 0);
        setToast({
          type: 'success',
          title: 'Promotion Sent',
          message: `Delivered to ${delivered} recipient(s)`,
          icon: 'gift',
          position: 'top'
        });
      } else {
        setError('Failed to send promotion');
        setToast({ type: 'error', title: 'Promotion Failed', message: 'Unable to deliver promotion' });
      }
    } catch (err) {
      console.error('Promotion send failed:', err);
      setError('Error sending promotion');
    }
  };

  // Apply overlay ad to selected videos with timing
  const handleApplyOverlayAd = async () => {
    if (overlayApplySelectedVideos.length === 0) {
      setToast({ type: 'error', title: 'No videos selected', message: 'Please select at least one video.' });
      return;
    }
    if (!overlayAdCompanyName || (overlayAdPosition !== 'videoPlayer' && (overlayAdTextItems.length === 0 && !overlayAdText)) || (overlayAdPosition === 'videoPlayer' && !overlayVideoUrl)) {
      setToast({ type: 'error', title: 'Missing fields', message: 'Please provide company name' + (overlayAdPosition === 'videoPlayer' ? ' and video/image/GIF' : ' and at least one message') + '.' });
      return;
    }

    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/apply-overlay-ad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          videoIds: overlayApplySelectedVideos,
          ad: {
            overlayAdCompanyName: overlayAdCompanyName,
            overlayAdText: overlayAdText,
            overlayAdTextItems: overlayAdTextItems,
            overlayAdEmoji: overlayAdEmoji,
            overlayAdBgColor: overlayAdBgColor,
            overlayAdTextColor: overlayAdTextColor,
            overlayBrandBgColor: overlayBrandBgColor,
            overlayBrandTextColor: overlayBrandTextColor,
            overlayAdOpacity: overlayAdOpacity,
            overlayTagOpacity: overlayTagOpacity,
            overlayAdPosition: overlayAdPosition,
            overlayBtnText: overlayBtnText,
            overlayProfileUrl: overlayProfileUrl,
            overlayVideoUrl: overlayVideoUrl,
            overlayExitTransition: overlayExitTransition,
            overlayBadgeType: overlayBadgeType,
            overlayBadgeColor: overlayBadgeColor,
            overlayBadgeLogo: overlayBadgeLogo,
            overlayBadgePosition: overlayBadgePosition,
            overlayCtaText: overlayCtaText,
            overlayCtaColor: overlayCtaColor,
            overlayCtaType: overlayCtaType,
            overlayCtaMedia: overlayCtaMedia,
            overlayCtaDelay: overlayCtaDelay,
            overlayCtaDuration: overlayCtaDuration,
            overlayTextAnimation: overlayTextAnimation,
            startTime: overlayApplyStartTime,
            duration: overlayApplyEndTime
          }
        })
      });

      if (res.ok) {
        const result = await res.json().catch(() => ({}));
        setToast({ type: 'success', title: 'Applied', message: `Overlay applied to ${overlayApplySelectedVideos.length} video(s).` });
        // Immediately update local videos state with returned data so ad badges show
        if (result.videos && Array.isArray(result.videos)) {
          setVideos(prev => prev.map(v => {
            const updated = result.videos.find(u => u.id === v.id);
            return updated ? { ...v, ads: updated.ads } : v;
          }));
        }
        // Also re-fetch in background for full sync
        if (staffSession) loadData(staffSession);
        // Don't close: setShowOverlayApplyModal(false);
        // Don't clear: setOverlayApplySelectedVideos([]);
        // Don't clear: setOverlayApplyVideoSearch('');
      } else {
        const errData = await res.json().catch(() => ({}));
        setToast({ type: 'error', title: 'Apply failed', message: errData.error || 'Unable to apply overlay ad.' });
      }
    } catch (err) {
      console.error('Overlay apply failed:', err);
      setToast({ type: 'error', title: 'Error', message: err.message || 'Error applying overlay ad.' });
    }
  };

  // Apply bottom ad to selected videos with timing
  const handleApplyBottomAd = async () => {
    if (bottomApplySelectedVideos.length === 0) {
      setToast({ type: 'error', title: 'No videos selected', message: 'Please select at least one video.' });
      return;
    }
    if (!bottomAdProfileName || (!bottomAdText && bottomAdTextItems.length === 0)) {
      setToast({ type: 'error', title: 'Missing fields', message: 'Please provide profile name and ad text.' });
      return;
    }

    // Check for timing conflicts on selected videos - WARN but allow stacking
    const newAdStart = bottomApplyStartTime;
    const newAdEnd = bottomApplyStartTime + bottomApplyDuration;
    let conflictWarnings = [];
    
    for (const videoId of bottomApplySelectedVideos) {
      const video = videos.find(v => v.id === videoId);
      if (video && video.ads?.bottom) {
        for (const existingAd of video.ads.bottom) {
          const existingStart = existingAd.startTime || 0;
          const existingEnd = existingStart + (existingAd.duration || 0);
          
          // Check if times overlap - warn but allow (for stacking preview feature)
          if (!(newAdEnd <= existingStart || newAdStart >= existingEnd)) {
            conflictWarnings.push({
              videoTitle: video.title,
              newAdTime: `${newAdStart}s-${newAdEnd}s`,
              existingAdTime: `${existingStart}s-${existingEnd}s`
            });
          }
        }
      }
    }

    // If conflicts exist, show warning but allow proceeding
    if (conflictWarnings.length > 0) {
      const conflictMsg = conflictWarnings
        .map(w => `"${w.videoTitle}": New (${w.newAdTime}) overlaps with existing (${w.existingAdTime})`)
        .join('\n');
      setToast({
        type: 'warning',
        title: 'Timing Overlap Detected',
        message: `These ads will stack horizontally as preview:\n${conflictMsg}\n\nThis is intentional - the preview feature allows multiple ads in the same timeframe.`
      });
    }

    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/apply-bottom-ad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          videoIds: bottomApplySelectedVideos,
          ad: {
            profileName: bottomAdProfileName,
            profileAvatar: bottomAdProfileAvatar,
            text: bottomAdText,
            textItems: bottomAdTextItems,
            textInterval: bottomAdTextInterval,
            textAnimation: bottomAdTextAnimation,
            cardAnimation: bottomAdCardAnimation,
            cardEffect: bottomAdCardEffect,
            cardExitAnimation: bottomAdCardExitAnimation,
            borderColor: bottomAdBorderColor,
            link: bottomAdLink,
            startTime: bottomApplyStartTime,
            duration: bottomApplyDuration,
            displayCount: bottomApplyDisplayCount,
            assets: adAssets
          }
        })
      });

      if (res.ok) {
        setToast({ type: 'success', title: 'Applied', message: `Bottom ad applied to ${bottomApplySelectedVideos.length} video(s).` });
        // Keep selections visible and reload data
        if (staffSession) loadData(staffSession);
        // Don't clear: setShowBottomApplyModal(false);
        // Don't clear: setBottomApplySelectedVideos([]);
        // Don't clear: setBottomApplyVideoSearch('');
      } else {
        setToast({ type: 'error', title: 'Apply failed', message: 'Unable to apply bottom ad.' });
      }
    } catch (err) {
      console.error('Bottom ad apply failed:', err);
      setToast({ type: 'error', title: 'Error', message: 'Error applying bottom ad.' });
    }
  };

  const handleApplyDefault2Ad = async () => {
    if (default2ApplySelectedVideos.length === 0) {
      setToast({ type: 'error', title: 'No videos selected', message: 'Please select at least one video.' });
      return;
    }
    if (!default2Title) {
      setToast({ type: 'error', title: 'Missing fields', message: 'Please provide at least a title.' });
      return;
    }

    try {
      const res = await fetch(`${getStaffBackendBaseUrl()}/staff/apply-default2-ad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffSession.id,
          videoIds: default2ApplySelectedVideos,
          ad: {
            lineColor: default2LineColor,
            bgColor: default2BgColor,
            textColor: default2TextColor,
            title: default2Title,
            description: default2Description,
            logo: default2Logo,
            link: default2Link,
            startTime: default2ApplyStartTime,
            duration: default2ApplyDuration,
            displayCount: default2ApplyDisplayCount
          }
        })
      });

      if (res.ok) {
        setToast({ type: 'success', title: 'Applied', message: `Default 2 ad applied to ${default2ApplySelectedVideos.length} video(s).` });
        if (staffSession) loadData(staffSession);
        setShowDefault2ApplyModal(false);
        setDefault2ApplySelectedVideos([]);
      } else {
        setToast({ type: 'error', title: 'Apply failed', message: 'Unable to apply Default 2 ad.' });
      }
    } catch (err) {
      console.error('Default 2 ad apply failed:', err);
      setToast({ type: 'error', title: 'Error', message: 'Error applying Default 2 ad.' });
    }
  };

  const handleNotificationPreview = (actionType, reason) => {
    let banMessage = '';
    if (actionType === 'ban') {
      if (banType === 'temporary') {
        const durationText = banDuration.value === 1 ? banDuration.unit.slice(0, -1) : banDuration.unit;
        banMessage = `Your account has been temporarily banned for ${banDuration.value} ${durationText}.\n\nReason: ${reason || 'Violating terms of service'}`;
      } else {
        banMessage = `Your account has been permanently banned.\n\nReason: ${reason || 'Violating terms of service'}`;
      }
    }

    const previews = {
      warn: {
        title: 'Warning Notice',
        message: `Your account has received a warning for violating community guidelines.\n\nReason: ${reason || 'Violating community guidelines'}`,
        color: '#f59e0b',
        iconType: 'warn'
      },
      ban: {
        title: 'Account Banned',
        message: banMessage,
        color: '#ef4444',
        iconType: 'ban'
      },
      shadowban: {
        title: 'Content Restricted',
        message: `Your content visibility has been restricted.\n\nReason: ${reason || 'Content violates guidelines'}`,
        color: '#6b7280',
        iconType: 'shadowban'
      },
      delete: {
        title: 'Account Deleted',
        message: `Your account and all associated content have been permanently deleted.\n\nReason: ${reason || 'Severe violation of terms of service'}`,
        color: '#8b5cf6',
        iconType: 'delete'
      }
    };
    setNotificationPreview(previews[actionType] || null);
  };

  if (!staffSession) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#666' }}>
        Please login as staff to access this dashboard
      </div>
    );
  }

  return (
    <>
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0' }}>Staff Admin Dashboard</h1>
        <p style={{ color: '#666', margin: '8px 0 0 0' }}>Welcome, {staffSession.name} ({staffSession.role})</p>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          marginBottom: '16px',
          color: '#dc2626',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Dropdown Menu */}
      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          onBlur={(e) => {
            if (!e.currentTarget.parentElement.contains(e.relatedTarget)) {
              setTimeout(() => setShowDropdown(false), 150);
            }
          }}
        >
          <span>
            {activeTab === 'videos' && `Videos (${videos.length})`}
            {activeTab === 'requests' && `Requests (${requests.length})`}
            {activeTab === 'comments' && `Comments (${comments.length})`}
            {activeTab === 'reports' && `Report Queue (${reports.length})`}
            {activeTab === 'users' && `Users (${users.length})`}
            {activeTab === 'creators' && `Creators (${creators.length})`}
            {activeTab === 'shadowDeleted' && `Shadow Deleted (${shadowDeleted.length})`}
            {activeTab === 'approvals' && `Account Approvals (${pendingAccounts.length})`}
          </span>
          <ChevronDown 
            size={20} 
            style={{
              transition: 'transform 0.3s ease',
              transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
            }} 
          />
        </button>

        {showDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '8px',
            backgroundColor: 'white',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            zIndex: 50,
            overflow: 'hidden',
            maxHeight: '320px',
            overflowY: 'auto'
          }}>
            <button
              onClick={() => navigateToTab('videos', 'videos')}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                backgroundColor: activeTab === 'videos' ? '#eff6ff' : (!hasPermission('videos') ? '#fef2f2' : 'white'),
                color: activeTab === 'videos' ? '#1e40af' : (!hasPermission('videos') ? '#dc2626' : '#374151'),
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === 'videos' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'videos' ? '#eff6ff' : (!hasPermission('videos') ? '#fef2f2' : 'white')}
            >
              {!hasPermission('videos') && '🚫 '}Videos ({videos.length})
            </button>
            <button
              onClick={() => navigateToTab('requests', 'requests')}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                backgroundColor: activeTab === 'requests' ? '#eff6ff' : (!hasPermission('requests') ? '#fef2f2' : 'white'),
                color: activeTab === 'requests' ? '#1e40af' : (!hasPermission('requests') ? '#dc2626' : '#374151'),
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === 'requests' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'requests' ? '#eff6ff' : (!hasPermission('requests') ? '#fef2f2' : 'white')}
            >
              {!hasPermission('requests') && '🚫 '}Requests ({requests.length})
            </button>
            <button
              onClick={() => navigateToTab('comments', 'comments')}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                backgroundColor: activeTab === 'comments' ? '#eff6ff' : (!hasPermission('comments') ? '#fef2f2' : 'white'),
                color: activeTab === 'comments' ? '#1e40af' : (!hasPermission('comments') ? '#dc2626' : '#374151'),
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === 'comments' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'comments' ? '#eff6ff' : (!hasPermission('comments') ? '#fef2f2' : 'white')}
            >
              {!hasPermission('comments') && '🚫 '}Comments ({comments.length})
            </button>
            <button
              onClick={() => navigateToTab('reports', 'reports')}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                backgroundColor: activeTab === 'reports' ? '#eff6ff' : (!hasPermission('reports') ? '#fef2f2' : 'white'),
                color: activeTab === 'reports' ? '#1e40af' : (!hasPermission('reports') ? '#dc2626' : '#374151'),
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === 'reports' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'reports' ? '#eff6ff' : (!hasPermission('reports') ? '#fef2f2' : 'white')}
            >
              {!hasPermission('reports') && '🚫 '}Report Queue ({reports.length})
            </button>
            <button
              onClick={() => navigateToTab('users', 'users')}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                backgroundColor: activeTab === 'users' ? '#eff6ff' : (!hasPermission('users') ? '#fef2f2' : 'white'),
                color: activeTab === 'users' ? '#1e40af' : (!hasPermission('users') ? '#dc2626' : '#374151'),
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === 'users' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'users' ? '#eff6ff' : (!hasPermission('users') ? '#fef2f2' : 'white')}
            >
              {!hasPermission('users') && '🚫 '}Users ({users.length})
            </button>
            <button
              onClick={() => navigateToTab('creators', 'creators')}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                backgroundColor: activeTab === 'creators' ? '#eff6ff' : (!hasPermission('creators') ? '#fef2f2' : 'white'),
                color: activeTab === 'creators' ? '#1e40af' : (!hasPermission('creators') ? '#dc2626' : '#374151'),
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === 'creators' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'creators' ? '#eff6ff' : (!hasPermission('creators') ? '#fef2f2' : 'white')}
            >
              {!hasPermission('creators') && '🚫 '}Creators ({creators.length})
            </button>
            <button
              onClick={() => navigateToTab('feedback', 'reports')}
              style={{
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                backgroundColor: activeTab === 'feedback' ? '#eff6ff' : 'white',
                color: activeTab === 'feedback' ? '#1e40af' : '#374151',
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === 'feedback' ? 'bold' : 'normal',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'feedback' ? '#eff6ff' : 'white'}
            >
              <Megaphone size={16} /> User Feedback
            </button>
            <button
              onClick={() => navigateToTab('support', 'support')}
              style={{
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                backgroundColor: activeTab === 'support' ? '#eff6ff' : 'white',
                color: activeTab === 'support' ? '#1e40af' : '#374151',
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === 'support' ? 'bold' : 'normal',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'support' ? '#eff6ff' : 'white'}
            >
              Support Tickets ({supportTickets ? supportTickets.length : 0})
            </button>
            <button
              onClick={() => navigateToTab('onboarding', 'onboarding')}
              style={{
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                backgroundColor: activeTab === 'onboarding' ? '#eff6ff' : 'white',
                color: activeTab === 'onboarding' ? '#1e40af' : '#374151',
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === 'onboarding' ? 'bold' : 'normal',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'onboarding' ? '#eff6ff' : 'white'}
            >
              Creator Onboarding Info
            </button>
            <button
              onClick={() => navigateToTab('shadowDeleted', 'shadowDeleted')}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left',
                backgroundColor: activeTab === 'shadowDeleted' ? '#eff6ff' : (!hasPermission('shadowDeleted') ? '#fef2f2' : 'white'),
                color: activeTab === 'shadowDeleted' ? '#1e40af' : (!hasPermission('shadowDeleted') ? '#dc2626' : '#374151'),
                border: 'none',
                borderBottom: staffSession?.role === 'administrator' ? '1px solid #e5e7eb' : '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'shadowDeleted' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'shadowDeleted' ? '#eff6ff' : (!hasPermission('shadowDeleted') ? '#fef2f2' : 'white')}
            >
              {!hasPermission('shadowDeleted') && '🚫 '}Shadow Deleted ({shadowDeleted.length})
            </button>
            {staffSession?.role === 'administrator' && (
              <button
                onClick={() => navigateToTab('approvals', 'approvals')}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'approvals' ? '#eff6ff' : 'white',
                  color: activeTab === 'approvals' ? '#1e40af' : '#374151',
                  border: 'none',
                  borderBottom: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === 'approvals' ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
                onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'approvals' ? '#eff6ff' : 'white'}
              >
                Account Approvals ({pendingAccounts.length})
              </button>
            )}
            {staffSession?.role === 'administrator' && (
              <button
                onClick={() => navigateToTab('staffManagement', 'staffManagement')}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'staffManagement' ? '#eff6ff' : 'white',
                  color: activeTab === 'staffManagement' ? '#1e40af' : '#374151',
                  border: 'none',
                  borderBottom: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === 'staffManagement' ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
                onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'staffManagement' ? '#eff6ff' : 'white'}
              >
                Manage Staff ({staffMembers.length})
              </button>
            )}
            <button
              onClick={() => {
                setStaffProfileModal({
                  isOpen: true,
                  showPasswordChange: false,
                  name: staffSession?.name || '',
                  email: staffSession?.email || '',
                  currentPasswords: staffSession?.passwords || ['', '', ''],
                  newPassword1: '',
                  newPassword2: '',
                  newPassword3: '',
                  showPassword1: false,
                  showPassword2: false,
                  showPassword3: false,
                  showCurrentPassword1: false,
                  showCurrentPassword2: false,
                  showCurrentPassword3: false
                });
                setShowDropdown(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left',
                backgroundColor: 'white',
                color: '#374151',
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'normal',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
              👤 My Profile
            </button>
            <button
              onClick={() => navigateToTab('promotions', 'promotions')}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left',
                backgroundColor: activeTab === 'promotions' ? '#eff6ff' : (!hasPermission('promotions') ? '#fef2f2' : 'white'),
                color: activeTab === 'promotions' ? '#1e40af' : (!hasPermission('promotions') ? '#dc2626' : '#374151'),
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'promotions' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === 'promotions' ? '#eff6ff' : (!hasPermission('promotions') ? '#fef2f2' : 'white')}
            >
              {!hasPermission('promotions') && '🚫 '}Promotions
            </button>
          </div>
        )}
        {/* Template Picker Modal */}
        {templatePickerOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setTemplatePickerOpen(false)}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', width: '90%', maxWidth: '520px', boxShadow: '0 12px 30px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Message Templates</h3>
              </div>
              <style>{`
                .templates-no-scroll::-webkit-scrollbar { display: none; }
                .templates-no-scroll { scrollbar-width: none; -ms-overflow-style: none; }
              `}</style>
              <div className="templates-no-scroll" style={{ maxHeight: '70vh', overflowY: 'scroll', position: 'relative' }}>
                {(!promoTemplates || promoTemplates.length === 0) && <div style={{ color: '#6b7280' }}>No templates yet — send a promotion to auto-save one.</div>}
                {promoTemplates.map(t => (
                  <div key={t.id} style={{ padding: '12px', marginBottom: '12px', background: '#ffffff', borderRadius: '10px', boxShadow: '0 6px 16px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827', marginBottom: '6px' }}>{t.title}</div>
                        <div style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'pre-wrap', lineHeight: 1.45, overflowWrap: 'break-word' }}>{t.message}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button onClick={() => { setPromotionModal({ ...promotionModal, title: t.title, message: t.message }); setTemplatePickerOpen(false); }} style={{ padding: '8px 12px', background: '#eef2ff', border: 'none', borderRadius: '8px', cursor: 'pointer', minWidth: '72px', fontWeight: 600 }}>Apply</button>
                      <button onClick={() => setEditingTemplate(t)} style={{ padding: '8px 12px', background: '#fff7ed', border: 'none', borderRadius: '8px', cursor: 'pointer', minWidth: '72px', fontWeight: 600 }}>Edit</button>
                      <button onClick={() => setPromoTemplates(prev => prev.filter(x => x.id !== t.id))} style={{ padding: '8px 12px', background: '#fee2e2', border: 'none', borderRadius: '8px', cursor: 'pointer', minWidth: '72px', fontWeight: 600 }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
              {editingTemplate && (
                <div style={{ marginTop: '12px', borderTop: '1px solid #eef2f6', paddingTop: '12px' }}>
                  <input value={editingTemplate.title} onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '8px', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
                  <textarea value={editingTemplate.message} onChange={(e) => setEditingTemplate({ ...editingTemplate, message: e.target.value })} style={{ width: '100%', padding: '8px', minHeight: '80px', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button onClick={() => { setPromoTemplates(prev => prev.map(p => p.id === editingTemplate.id ? editingTemplate : p)); setEditingTemplate(null); }} style={{ padding: '8px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px' }}>Save</button>
                    <button onClick={() => setEditingTemplate(null)} style={{ padding: '8px 12px', background: '#e5e7eb', border: 'none', borderRadius: '8px' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
          Loading...
        </div>
      ) : (
        <>
          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <div>
              {/* Search Bar */}
              <div style={{
                marginBottom: '24px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Search size={18} style={{
                  position: 'absolute',
                  left: '12px',
                  color: '#6b7280',
                  pointerEvents: 'none'
                }} />
                <input
                  type="text"
                  placeholder="Search videos by title, author..."
                  value={videoSearch}
                  onChange={(e) => setVideoSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4f46e5';
                    e.target.style.boxShadow = '0 4px 12px rgba(79,70,229,0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                  }}
                />
              </div>
              
              {
                (() => {
                  const filteredVideos = videos.filter(video =>
                    video.title.toLowerCase().includes(videoSearch.toLowerCase()) ||
                    video.author.toLowerCase().includes(videoSearch.toLowerCase())
                  );
                  
                  return filteredVideos.length === 0 ? (
                    <div style={{
                      padding: '48px 32px',
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                      borderRadius: '10px',
                      color: '#6b7280',
                      border: '1px solid #d1d5db'
                    }}>
                      <div style={{ 
                        width: '72px',
                        height: '72px',
                        backgroundColor: 'rgba(79,70,229,0.1)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                      }}>
                        <Eye size={36} style={{ color: '#4f46e5' }} />
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
                        {videoSearch ? 'No Videos Found' : 'No Videos Yet'}
                      </p>
                      <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>
                        {videoSearch ? `No results for "${videoSearch}"` : 'Upload and manage videos to get started'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                        Showing {filteredVideos.length} of {videos.length} videos
                      </p>
                      {filteredVideos.map(video => (
                    <div key={video.id} style={{
                      padding: '16px',
                      border: video.hidden ? '2px solid #f59e0b' : video.deleted ? '2px solid #a855f7' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: video.hidden ? '#fef3c7' : video.deleted ? '#faf5ff' : '#fff',
                      position: 'relative'
                    }}>
                      {/* Status Tags */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        {video.hidden && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 12px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            <EyeOff size={14} />
                            Hidden
                          </span>
                        )}
                        {video.deleted && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 12px',
                            backgroundColor: '#a855f7',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            <Trash2 size={14} />
                            Deleted
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                            {video.title}
                          </h3>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                            Author: {video.author}
                          </p>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                            Views: {video.views} | Likes: {video.likes} | Comments: {video.comments}
                          </p>
                          <p style={{ margin: '4px 0', color: '#999', fontSize: '12px' }}>
                            {new Date(video.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', alignItems: 'flex-end' }}>
                          {!video.hidden && !video.deleted && (
                            <>
                              <button
                                onClick={() => setActionModal({ isOpen: true, itemId: video.id, itemType: 'video' })}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: 'white',
                                  color: '#dc2626',
                                  border: '2px solid #dc2626',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#dc2626';
                                  e.target.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = 'white';
                                  e.target.style.color = '#dc2626';
                                }}
                              >
                                Action
                              </button>
                              <button
                                onClick={() => setSelectedVideoForAdMgmt(video)}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: 'white',
                                  color: '#0b74de',
                                  border: '2px solid #0b74de',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#0b74de';
                                  e.target.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = 'white';
                                  e.target.style.color = '#0b74de';
                                }}
                              >
                                Manage Ads
                              </button>
                            </>
                          )}
                          {(video.hidden || video.deleted) && (
                            <button
                              onClick={() => setUndoModal({ isOpen: true, action: video.hidden ? 'unhide' : 'undelete', itemId: video.id, itemType: 'video' })}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: 'white',
                                color: '#10b981',
                                border: '2px solid #10b981',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#10b981';
                                e.target.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.color = '#10b981';
                              }}
                            >
                              Undo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                      ))}
                      </div>
                    );
                  })()
                }
                
                {/* Floating Navigation Buttons for Videos */}
                <div style={{
                  position: 'fixed',
                  right: '20px',
                  bottom: '90px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  zIndex: 40
                }}>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    title="Go to top"
                    style={{
                      padding: '12px 12px',
                      backgroundColor: '#4f46e5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
                      width: '44px',
                      height: '44px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#4338ca';
                      e.target.style.boxShadow = '0 6px 20px rgba(79,70,229,0.4)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#4f46e5';
                      e.target.style.boxShadow = '0 4px 12px rgba(79,70,229,0.3)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <ChevronUp size={20} />
                  </button>
                  <button
                    onClick={() => {
                      const lastPos = savedScrollPositions['videos'] || 0;
                      if (lastPos > 0) {
                        window.scrollTo({ top: lastPos, behavior: 'smooth' });
                      }
                    }}
                    title="Go back to last position"
                    style={{
                      padding: '12px 12px',
                      backgroundColor: (savedScrollPositions['videos'] || 0) > 0 ? '#4f46e5' : '#d1d5db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: (savedScrollPositions['videos'] || 0) > 0 ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      boxShadow: (savedScrollPositions['videos'] || 0) > 0 ? '0 4px 12px rgba(79,70,229,0.3)' : 'none',
                      width: '44px',
                      height: '44px',
                      opacity: (savedScrollPositions['videos'] || 0) > 0 ? 1 : 0.6
                    }}
                    onMouseEnter={(e) => {
                      if ((savedScrollPositions['videos'] || 0) > 0) {
                        e.target.style.backgroundColor = '#4338ca';
                        e.target.style.boxShadow = '0 6px 20px rgba(79,70,229,0.4)';
                        e.target.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = (savedScrollPositions['videos'] || 0) > 0 ? '#4f46e5' : '#d1d5db';
                      e.target.style.boxShadow = (savedScrollPositions['videos'] || 0) > 0 ? '0 4px 12px rgba(79,70,229,0.3)' : 'none';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <ChevronDown size={20} />
                  </button>
                </div>
            </div>
          )}
          {activeTab === 'requests' && (
            <div>
              {/* Search Bar */}
              <div style={{
                marginBottom: '24px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Search size={18} style={{
                  position: 'absolute',
                  left: '12px',
                  color: '#6b7280',
                  pointerEvents: 'none'
                }} />
                <input
                  type="text"
                  placeholder="Search requests by title, company..."
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4f46e5';
                    e.target.style.boxShadow = '0 4px 12px rgba(79,70,229,0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                  }}
                />
              </div>
              
              {
                (() => {
                  const filteredRequests = requests.filter(req =>
                    req.title.toLowerCase().includes(requestSearch.toLowerCase()) ||
                    (req.company && req.company.toLowerCase().includes(requestSearch.toLowerCase()))
                  );
                  
                  return filteredRequests.length === 0 ? (
                    <div style={{
                      padding: '48px 32px',
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                      borderRadius: '10px',
                      color: '#6b7280',
                      border: '1px solid #d1d5db'
                    }}>
                      <div style={{ 
                        width: '72px',
                        height: '72px',
                        backgroundColor: 'rgba(79,70,229,0.1)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                      }}>
                        <Eye size={36} style={{ color: '#4f46e5' }} />
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
                        {requestSearch ? 'No Requests Found' : 'No Requests Yet'}
                      </p>
                      <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>
                        {requestSearch ? `No results for "${requestSearch}"` : 'Manage special requests from users here'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                        Showing {filteredRequests.length} of {requests.length} requests
                      </p>
                      {filteredRequests.map(req => {
                        // Determine border color: accent color if boosted or selected, otherwise grey
                        const isSelected = requestAccentColorSelection[req.id];
                        const isBoosted = (req.boosts || 0) >= 1;
                        const useAccentBorder = isSelected || isBoosted;
                        const accentColor = '#9333ea'; // Purple accent from theme
                        
                        let borderColor = '#9ca3af'; // Grey outline by default
                        let borderWidth = '1px';
                        
                        if (req.hidden) {
                          borderColor = '#f59e0b';
                          borderWidth = '2px';
                        } else if (req.deleted) {
                          borderColor = '#a855f7';
                          borderWidth = '2px';
                        } else if (useAccentBorder) {
                          borderColor = accentColor;
                          borderWidth = '2px';
                        }
                        
                        return (
                    <div key={req.id} style={{
                      padding: '16px',
                      border: `${borderWidth} solid ${borderColor}`,
                      borderRadius: '8px',
                      backgroundColor: req.hidden ? '#fef3c7' : req.deleted ? '#faf5ff' : (useAccentBorder ? hexToRgba(accentColor, 0.05) : '#fff'),
                      position: 'relative',
                      transition: 'all 0.2s ease'
                    }}>
                      {/* Status Tags */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        {req.hidden && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 12px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            <EyeOff size={14} />
                            Hidden
                          </span>
                        )}
                        {req.deleted && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 12px',
                            backgroundColor: '#a855f7',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            <Trash2 size={14} />
                            Deleted
                          </span>
                        )}
                        {isBoosted && !requestAccentColorSelection[req.id] && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 12px',
                            backgroundColor: accentColor,
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            <Megaphone size={14} />
                            Boosted
                          </span>
                        )}
                        {isSelected && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 12px',
                            backgroundColor: accentColor,
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            <Crown size={14} />
                            Admin Selected
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                            {req.title}
                          </h3>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                            Requester: {req.company}
                          </p>
                          {req.claimedBy && (
                            <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                              Claimed by: {req.claimedBy.name}
                            </p>
                          )}
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                            Likes: {req.likes} | Comments: {req.comments} | Boosts: {req.boosts || 0}
                          </p>
                          <p style={{ margin: '4px 0', color: '#999', fontSize: '12px' }}>
                            {new Date(req.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', alignItems: 'flex-end' }}>
                          {!req.hidden && !req.deleted && (
                            <>
                              <button
                                onClick={() => setActionModal({ isOpen: true, itemId: req.id, itemType: 'request' })}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: 'white',
                                  color: '#dc2626',
                                  border: '2px solid #dc2626',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#dc2626';
                                  e.target.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = 'white';
                                  e.target.style.color = '#dc2626';
                                }}
                              >
                                Action
                              </button>
                              <button
                                onClick={() => {
                                  let newSelection;
                                  if (requestAccentColorSelection[req.id]) {
                                    newSelection = { ...requestAccentColorSelection };
                                    delete newSelection[req.id];
                                  } else {
                                    newSelection = {
                                      ...requestAccentColorSelection,
                                      [req.id]: true
                                    };
                                  }
                                  setRequestAccentColorSelection(newSelection);
                                  localStorage.setItem('requestAccentColorSelection', JSON.stringify(newSelection));
                                  // Dispatch custom event for same-page listeners
                                  window.dispatchEvent(new CustomEvent('adminSelectionChanged', { detail: newSelection }));
                                }}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: requestAccentColorSelection[req.id] ? '#9333ea' : 'white',
                                  color: requestAccentColorSelection[req.id] ? 'white' : '#9333ea',
                                  border: '2px solid #9333ea',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                onMouseEnter={(e) => {
                                  if (!requestAccentColorSelection[req.id]) {
                                    e.target.style.backgroundColor = 'rgba(147, 51, 234, 0.1)';
                                  } else {
                                    e.target.style.backgroundColor = '#7c3aed';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = requestAccentColorSelection[req.id] ? '#9333ea' : 'white';
                                }}
                                title="Toggle accent color outline for this request"
                              >
                                <Crown size={14} />
                                {requestAccentColorSelection[req.id] ? 'Selected' : 'Select'}
                              </button>
                            </>
                          )}
                          {(req.hidden || req.deleted) && (
                            <button
                              onClick={() => setUndoModal({ isOpen: true, action: req.hidden ? 'unhide' : 'undelete', itemId: req.id, itemType: 'request' })}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: 'white',
                                color: '#10b981',
                                border: '2px solid #10b981',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#10b981';
                                e.target.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.color = '#10b981';
                              }}
                            >
                              Undo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                        );
                      })}
                    </div>
                  );
                })()
              }
              
              {/* Floating Navigation Buttons for Requests */}
              <div style={{
                position: 'fixed',
                right: '20px',
                bottom: '90px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                zIndex: 40
              }}>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  title="Go to top"
                  style={{
                    padding: '12px 12px',
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
                    width: '44px',
                    height: '44px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#4338ca';
                    e.target.style.boxShadow = '0 6px 20px rgba(79,70,229,0.4)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#4f46e5';
                    e.target.style.boxShadow = '0 4px 12px rgba(79,70,229,0.3)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <ChevronUp size={20} />
                </button>
                <button
                  onClick={() => {
                    const lastPos = savedScrollPositions['requests'] || 0;
                    if (lastPos > 0) {
                      window.scrollTo({ top: lastPos, behavior: 'smooth' });
                    }
                  }}
                  title="Go back to last position"
                  style={{
                    padding: '12px 12px',
                    backgroundColor: (savedScrollPositions['requests'] || 0) > 0 ? '#4f46e5' : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (savedScrollPositions['requests'] || 0) > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: (savedScrollPositions['requests'] || 0) > 0 ? '0 4px 12px rgba(79,70,229,0.3)' : 'none',
                    width: '44px',
                    height: '44px',
                    opacity: (savedScrollPositions['requests'] || 0) > 0 ? 1 : 0.6
                  }}
                  onMouseEnter={(e) => {
                    if ((savedScrollPositions['requests'] || 0) > 0) {
                      e.target.style.backgroundColor = '#4338ca';
                      e.target.style.boxShadow = '0 6px 20px rgba(79,70,229,0.4)';
                      e.target.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = (savedScrollPositions['requests'] || 0) > 0 ? '#4f46e5' : '#d1d5db';
                    e.target.style.boxShadow = (savedScrollPositions['requests'] || 0) > 0 ? '0 4px 12px rgba(79,70,229,0.3)' : 'none';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <ChevronDown size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div>
              {/* Search Bar */}
              <div style={{
                marginBottom: '24px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Search size={18} style={{
                  position: 'absolute',
                  left: '12px',
                  color: '#6b7280',
                  pointerEvents: 'none'
                }} />
                <input
                  type="text"
                  placeholder="Search comments by text, author..."
                  value={commentSearch}
                  onChange={(e) => setCommentSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4f46e5';
                    e.target.style.boxShadow = '0 4px 12px rgba(79,70,229,0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                  }}
                />
              </div>
              
              {
                (() => {
                  const filteredComments = comments.filter(comment =>
                    (comment.text || '').toLowerCase().includes(commentSearch.toLowerCase()) ||
                    (comment.userName && comment.userName.toLowerCase().includes(commentSearch.toLowerCase()))
                  );
                  
                  return filteredComments.length === 0 ? (
                    <div style={{
                      padding: '48px 32px',
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                      borderRadius: '10px',
                      color: '#6b7280',
                      border: '1px solid #d1d5db'
                    }}>
                      <div style={{ 
                        width: '72px',
                        height: '72px',
                        backgroundColor: 'rgba(79,70,229,0.1)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                      }}>
                        <Eye size={36} style={{ color: '#4f46e5' }} />
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
                        {commentSearch ? 'No Comments Found' : 'No Comments Yet'}
                      </p>
                      <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>
                        {commentSearch ? `No results for "${commentSearch}"` : 'Manage and moderate comments here'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                        Showing {filteredComments.length} of {comments.length} comments
                      </p>
                      {filteredComments.map(comment => (
                    <div key={comment.id} style={{
                      padding: '16px',
                      border: comment.hidden ? '2px solid #f59e0b' : comment.deleted ? '2px solid #a855f7' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: comment.hidden ? '#fef3c7' : comment.deleted ? '#faf5ff' : '#fff',
                      position: 'relative'
                    }}>
                      {/* Status Tags */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        {comment.hidden && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 12px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            <EyeOff size={14} />
                            Hidden
                          </span>
                        )}
                        {comment.deleted && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 12px',
                            backgroundColor: '#a855f7',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            <Trash2 size={14} />
                            Deleted
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                            {comment.userName}
                          </h3>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                            {comment.text}
                          </p>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '12px' }}>
                            On request: {comment.requestId}
                          </p>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '12px' }}>
                            Likes: {comment.likesCount} | Dislikes: {comment.dislikesCount}
                          </p>
                          <p style={{ margin: '4px 0', color: '#999', fontSize: '12px' }}>
                            {new Date(comment.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', alignItems: 'flex-end' }}>
                          {!comment.hidden && !comment.deleted && (
                            <button
                              onClick={() => setActionModal({ isOpen: true, itemId: comment.id, itemType: 'comment' })}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: 'white',
                                color: '#dc2626',
                                border: '2px solid #dc2626',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#dc2626';
                                e.target.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.color = '#dc2626';
                              }}
                            >
                              Action
                            </button>
                          )}
                          {(comment.hidden || comment.deleted) && (
                            <button
                              onClick={() => setUndoModal({ isOpen: true, action: comment.hidden ? 'unhide' : 'undelete', itemId: comment.id, itemType: 'comment' })}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: 'white',
                                color: '#10b981',
                                border: '2px solid #10b981',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#10b981';
                                e.target.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.color = '#10b981';
                              }}
                            >
                              Undo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                    </div>
                  );
                })()
              }
              
              {/* Floating Navigation Buttons for Comments */}
              <div style={{
                position: 'fixed',
                right: '20px',
                bottom: '90px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                zIndex: 40
              }}>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  title="Go to top"
                  style={{
                    padding: '12px 12px',
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
                    width: '44px',
                    height: '44px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#4338ca';
                    e.target.style.boxShadow = '0 6px 20px rgba(79,70,229,0.4)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#4f46e5';
                    e.target.style.boxShadow = '0 4px 12px rgba(79,70,229,0.3)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <ChevronUp size={20} />
                </button>
                <button
                  onClick={() => {
                    const lastPos = savedScrollPositions['comments'] || 0;
                    if (lastPos > 0) {
                      window.scrollTo({ top: lastPos, behavior: 'smooth' });
                    }
                  }}
                  title="Go back to last position"
                  style={{
                    padding: '12px 12px',
                    backgroundColor: (savedScrollPositions['comments'] || 0) > 0 ? '#4f46e5' : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (savedScrollPositions['comments'] || 0) > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: (savedScrollPositions['comments'] || 0) > 0 ? '0 4px 12px rgba(79,70,229,0.3)' : 'none',
                    width: '44px',
                    height: '44px',
                    opacity: (savedScrollPositions['comments'] || 0) > 0 ? 1 : 0.6
                  }}
                  onMouseEnter={(e) => {
                    if ((savedScrollPositions['comments'] || 0) > 0) {
                      e.target.style.backgroundColor = '#4338ca';
                      e.target.style.boxShadow = '0 6px 20px rgba(79,70,229,0.4)';
                      e.target.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = (savedScrollPositions['comments'] || 0) > 0 ? '#4f46e5' : '#d1d5db';
                    e.target.style.boxShadow = (savedScrollPositions['comments'] || 0) > 0 ? '0 4px 12px rgba(79,70,229,0.3)' : 'none';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <ChevronDown size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              {/* User Action Feedback Card */}
              {userActionFeedback.isVisible && (
                <div style={{
                  marginBottom: '24px',
                  padding: '16px',
                  backgroundColor: '#eff6ff',
                  border: '2px solid #3b82f6',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  animation: 'slideIn 0.3s ease',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 
                      userActionFeedback.action === 'warn' ? '#f59e0b' :
                      userActionFeedback.action === 'ban' ? '#ef4444' :
                      userActionFeedback.action === 'shadowban' ? '#8b5cf6' :
                      userActionFeedback.action === 'delete' ? '#dc2626' : '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '20px',
                    flexShrink: 0
                  }}>
                    {userActionFeedback.action === 'warn' && '⚠️'}
                    {userActionFeedback.action === 'ban' && '🚫'}
                    {userActionFeedback.action === 'shadowban' && '👁️'}
                    {userActionFeedback.action === 'delete' && '🗑️'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', color: '#1e40af', fontSize: '14px', fontWeight: 'bold' }}>
                      Action Applied: {userActionFeedback.action.toUpperCase()}
                    </h4>
                    <p style={{ margin: '0', color: '#1e3a8a', fontSize: '13px' }}>
                      <strong>{userActionFeedback.userName}</strong> - {userActionFeedback.reason}
                    </p>
                  </div>
                  <button
                    onClick={handleUndoUserAction}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#059669';
                      e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#10b981';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    ↶ Undo
                  </button>
                </div>
              )}

              {/* Search Bar */}
              <div style={{
                marginBottom: '24px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}>
                <div style={{
                  flex: 1,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Search size={18} style={{
                    position: 'absolute',
                    left: '12px',
                    color: '#6b7280',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type="text"
                    placeholder="Search users by name, email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#4f46e5';
                      e.target.style.boxShadow = '0 4px 12px rgba(79,70,229,0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                    }}
                  />
                </div>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  title="Go to top"
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    color: '#4f46e5'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#e5e7eb';
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f3f4f6';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  onClick={() => {
                    const lastPos = savedScrollPositions[activeTab] || 0;
                    if (lastPos > 0) {
                      window.scrollTo({ top: lastPos, behavior: 'smooth' });
                    }
                  }}
                  title="Go back to last position"
                  style={{
                    padding: '10px 14px',
                    backgroundColor: (savedScrollPositions[activeTab] || 0) > 0 ? '#f3f4f6' : '#e5e7eb',
                    border: `1px solid ${(savedScrollPositions[activeTab] || 0) > 0 ? '#e5e7eb' : '#d1d5db'}`,
                    borderRadius: '8px',
                    cursor: (savedScrollPositions[activeTab] || 0) > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    color: (savedScrollPositions[activeTab] || 0) > 0 ? '#4f46e5' : '#9ca3af',
                    opacity: (savedScrollPositions[activeTab] || 0) > 0 ? 1 : 0.6
                  }}
                  onMouseEnter={(e) => {
                    if ((savedScrollPositions[activeTab] || 0) > 0) {
                      e.target.style.backgroundColor = '#e5e7eb';
                      e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if ((savedScrollPositions[activeTab] || 0) > 0) {
                      e.target.style.backgroundColor = '#f3f4f6';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                >
                  <ChevronDown size={18} />
                </button>
              </div>
              
              {
                (() => {
                  const filteredUsers = users.filter(user =>
                    user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                    (user.email && user.email.toLowerCase().includes(userSearch.toLowerCase()))
                  );
                  
                  return filteredUsers.length === 0 ? (
                    <div style={{
                      padding: '48px 32px',
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                      borderRadius: '10px',
                      color: '#6b7280',
                      border: '1px solid #d1d5db'
                    }}>
                      <div style={{ 
                        width: '72px',
                        height: '72px',
                        backgroundColor: 'rgba(79,70,229,0.1)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                      }}>
                        <Users size={36} style={{ color: '#4f46e5' }} />
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
                        {userSearch ? 'No Users Found' : 'No Users Yet'}
                      </p>
                      <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>
                        {userSearch ? `No results for "${userSearch}"` : 'User management and moderation tools'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                        Showing {filteredUsers.length} of {users.length} users
                      </p>
                      {filteredUsers.map(user => {
                        const isCollapsed = collapsedUsers.has(user.id);
                        return (
                        <div key={user.id} style={{
                          padding: '16px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          backgroundColor: user.status === 'banned' ? '#fee2e2' : user.shadowBanned ? '#fef3c7' : '#fff',
                          transition: 'all 0.3s ease',
                          boxShadow: isCollapsed ? '0 1px 3px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          {/* Header - Always Visible */}
                          <div style={{
                            display: 'flex',
                            gap: '16px',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => {
                            setCollapsedUsers(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(user.id)) newSet.delete(user.id);
                              else newSet.add(user.id);
                              return newSet;
                            });
                          }}>
                            {/* Profile Picture - Smaller in Collapsed */}
                            <div style={{
                              width: isCollapsed ? '60px' : '80px',
                              height: isCollapsed ? '60px' : '80px',
                              borderRadius: '50%',
                              backgroundColor: '#e5e7eb',
                              overflow: 'hidden',
                              flexShrink: 0,
                              transition: 'all 0.3s ease'
                            }}>
                              {user.image ? (
                                <img src={user.image} alt={user.name} style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }} />
                              ) : (
                                <div style={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#d1d5db',
                                  color: '#fff',
                                  fontSize: '24px',
                                  fontWeight: 'bold'
                                }}>
                                  {(user.name || 'U')[0].toUpperCase()}
                                </div>
                              )}
                            </div>

                            {/* Header Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                  <h3 style={{ margin: '0 0 4px 0', fontSize: isCollapsed ? '15px' : '16px', fontWeight: 'bold', transition: 'font-size 0.3s' }}>
                                    {user.name}
                                    {user.isCreator && <span style={{ marginLeft: '6px', color: '#f59e0b', fontSize: '11px', fontWeight: 'bold' }}>👑</span>}
                                  </h3>
                                  <p style={{ margin: '0', color: '#666', fontSize: '13px' }}>
                                    @{user.email.split('@')[0]}
                                  </p>
                                </div>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  flexShrink: 0
                                }}>
                                  <span style={{
                                    padding: '4px 8px',
                                    backgroundColor: user.status === 'banned' ? '#dc2626' : user.shadowBanned ? '#f59e0b' : '#10b981',
                                    color: 'white',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    borderRadius: '4px'
                                  }}>
                                    {user.status === 'banned' ? '🚫 Banned' : user.shadowBanned ? '👁️ Shadow' : '✓ Active'}
                                  </span>
                                  <ChevronDown size={20} style={{
                                    transform: isCollapsed ? 'rotate(0deg)' : 'rotate(-180deg)',
                                    transition: 'transform 0.3s ease',
                                    color: '#6b7280'
                                  }} />
                                </div>
                              </div>

                              {/* Joined Date in Collapsed Header */}
                              {isCollapsed && (
                                <p style={{ margin: '6px 0 0 0', color: '#666', fontSize: '12px' }}>
                                  Joined {new Date(user.createdAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Expandable Content */}
                          {!isCollapsed && (
                            <div style={{ 
                              marginTop: '16px',
                              paddingTop: '16px',
                              borderTop: '1px solid rgba(229, 231, 235, 0.5)',
                              animation: 'fadeIn 0.3s ease'
                            }}>
                              {/* Status Tags & Action Button */}
                              <div style={{
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'center',
                                marginBottom: '12px',
                                flexWrap: 'wrap'
                              }}>
                                {(user.status === 'banned' || user.shadowBanned || user.warnings > 0) && (
                                  <>
                                    {user.status === 'banned' && (
                                      <span style={{
                                        padding: '4px 10px',
                                        backgroundColor: '#fee2e2',
                                        color: '#dc2626',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}>
                                        🚫 Banned
                                      </span>
                                    )}
                                    {user.shadowBanned && (
                                      <span style={{
                                        padding: '4px 10px',
                                        backgroundColor: '#fef3c7',
                                        color: '#92400e',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}>
                                        👁️ Shadowbanned
                                      </span>
                                    )}
                                    {user.warnings > 0 && (
                                      <span style={{
                                        padding: '4px 10px',
                                        backgroundColor: '#fef08a',
                                        color: '#b45309',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}>
                                        ⚠️ {user.warnings} Warning{user.warnings > 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </>
                                )}
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUserActionModal({ isOpen: true, userId: user.id, action: null });
                                    setReasonModal({ isOpen: true, action: 'user', itemId: null, itemType: null, reason: '' });
                                  }}
                                  style={{
                                    padding: '8px 16px',
                                    backgroundColor: 'white',
                                    color: '#dc2626',
                                    border: '2px solid #dc2626',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s',
                                    marginLeft: 'auto'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#dc2626';
                                    e.target.style.color = 'white';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'white';
                                    e.target.style.color = '#dc2626';
                                  }}
                                >
                                  Take Action
                                </button>
                              </div>

                              {/* Bio */}
                              {user.bio && (
                                <p style={{ margin: '8px 0', color: '#666', fontSize: '13px', fontStyle: 'italic', paddingLeft: '8px', borderLeft: '3px solid #3b82f6' }}>
                                  "{user.bio}"
                                </p>
                              )}

                              {/* User Details Grid */}
                              <div style={{ 
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '16px',
                                marginTop: '12px'
                              }}>
                                <div style={{ padding: '10px', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '6px' }}>
                                  <span style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>EMAIL</span>
                                  <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13px', wordBreak: 'break-all' }}>{user.email}</p>
                                </div>
                                <div style={{ padding: '10px', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '6px' }}>
                                  <span style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>JOINED</span>
                                  <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13px' }}>
                                    {new Date(user.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                {user.isCreator && (
                                  <div style={{ padding: '10px', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '6px' }}>
                                    <span style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>CREATOR SINCE</span>
                                    <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13px' }}>
                                      {new Date(user.creatorSince).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                                {/* Referral Info */}
                                {user.referralCode && (
                                  <div style={{ padding: '10px', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '6px' }}>
                                    <span style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>REFERRAL CODE</span>
                                    <p style={{ margin: '4px 0 0', color: '#10b981', fontSize: '13px', fontWeight: '600', fontFamily: 'monospace' }}>{user.referralCode}</p>
                                  </div>
                                )}
                                <div style={{ padding: '10px', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '6px' }}>
                                  <span style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>REFERRALS</span>
                                  <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13px' }}>{user.referralCount || 0} referred users</p>
                                </div>
                                {user.referrerId && (
                                  <div style={{ padding: '10px', backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: '6px' }}>
                                    <span style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>REFERRED BY</span>
                                    <p style={{ margin: '4px 0 0', color: '#6366f1', fontSize: '13px' }}>{(() => { const ref = users.find(u2 => u2.id === user.referrerId); return ref ? (ref.name || ref.email) : user.referrerId; })()}</p>
                                  </div>
                                )}
                              </div>
                              {/* Referred Users Breakdown */}
                              {(user.referralCount > 0) && (() => {
                                const referredUsers = users.filter(u2 => u2.referrerId === user.id);
                                if (referredUsers.length === 0) return null;
                                return (
                                  <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(16, 185, 129, 0.04)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.12)' }}>
                                    <span style={{ color: '#10b981', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Referred Users ({referredUsers.length})</span>
                                    <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      {referredUsers.map(ru => {
                                        const ruRequests = (requests || []).filter(r => r.userId === ru.id || r.requesterId === ru.id);
                                        const fulfilled = ruRequests.filter(r => r.status === 'fulfilled' || r.status === 'completed').length;
                                        const made = ruRequests.length;
                                        return (
                                          <div key={ru.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', backgroundColor: '#fff', borderRadius: '4px', fontSize: '12px' }}>
                                            <span style={{ color: '#374151', fontWeight: '500' }}>{ru.name || ru.email}</span>
                                            <span style={{ color: '#6b7280' }}>{fulfilled >= 4 ? '✅' : '⏳'} {fulfilled}/4 fulfilled · {made >= 2 ? '✅' : '⏳'} {made}/2 made</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}

                              {user.warnings > 0 && (
                                <div style={{ 
                                  marginTop: '12px',
                                  padding: '10px',
                                  backgroundColor: 'rgba(220, 38, 38, 0.05)',
                                  border: '1px solid rgba(220, 38, 38, 0.2)',
                                  borderRadius: '6px',
                                  color: '#dc2626',
                                  fontSize: '13px'
                                }}>
                                  ⚠️ {user.warnings} {user.warnings === 1 ? 'warning' : 'warnings'}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        );
                      })}
                      </div>
                    );
                  })()
                }
                
                {/* Floating Navigation Buttons for Users */}
                <div style={{
                  position: 'fixed',
                  right: '20px',
                  bottom: '90px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  zIndex: 40
                }}>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    title="Go to top"
                    style={{
                      padding: '12px 12px',
                      backgroundColor: '#4f46e5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
                      width: '44px',
                      height: '44px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#4338ca';
                      e.target.style.boxShadow = '0 6px 20px rgba(79,70,229,0.4)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#4f46e5';
                      e.target.style.boxShadow = '0 4px 12px rgba(79,70,229,0.3)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <ChevronUp size={20} />
                  </button>
                  <button
                    onClick={() => {
                      const lastPos = savedScrollPositions['users'] || 0;
                      if (lastPos > 0) {
                        window.scrollTo({ top: lastPos, behavior: 'smooth' });
                      }
                    }}
                    title="Go back to last position"
                    style={{
                      padding: '12px 12px',
                      backgroundColor: (savedScrollPositions['users'] || 0) > 0 ? '#4f46e5' : '#d1d5db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: (savedScrollPositions['users'] || 0) > 0 ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      boxShadow: (savedScrollPositions['users'] || 0) > 0 ? '0 4px 12px rgba(79,70,229,0.3)' : 'none',
                      width: '44px',
                      height: '44px',
                      opacity: (savedScrollPositions['users'] || 0) > 0 ? 1 : 0.6
                    }}
                    onMouseEnter={(e) => {
                      if ((savedScrollPositions['users'] || 0) > 0) {
                        e.target.style.backgroundColor = '#4338ca';
                        e.target.style.boxShadow = '0 6px 20px rgba(79,70,229,0.4)';
                        e.target.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = (savedScrollPositions['users'] || 0) > 0 ? '#4f46e5' : '#d1d5db';
                      e.target.style.boxShadow = (savedScrollPositions['users'] || 0) > 0 ? '0 4px 12px rgba(79,70,229,0.3)' : 'none';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <ChevronDown size={20} />
                  </button>
                </div>
            </div>
          )}

          {/* Creators Tab */}
          {/* Creators Tab */}
          {activeTab === 'creators' && (
            <div>
              {/* Search Bar */}
              <div style={{
                marginBottom: '12px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Search size={18} style={{
                  position: 'absolute',
                  left: '12px',
                  color: '#6b7280',
                  pointerEvents: 'none'
                }} />
                <input
                  type="text"
                  placeholder="Search creators..."
                  value={creatorSearch}
                  onChange={(e) => setCreatorSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    marginBottom: '12px'
                  }}
                />
              </div>

              {creators.length === 0 ? (
                <div style={{
                  padding: '48px 32px',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  borderRadius: '10px',
                  color: '#6b7280',
                  border: '1px solid #d1d5db'
                }}>
                  <div style={{ 
                    width: '72px',
                    height: '72px',
                    backgroundColor: 'rgba(79,70,229,0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <Users size={36} style={{ color: '#4f46e5' }} />
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>No Creators Yet</p>
                  <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>Creator accounts and dashboard tools</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {creators.filter(c => 
                    (c.name || '').toLowerCase().includes(creatorSearch.toLowerCase()) ||
                    (c.email || '').toLowerCase().includes(creatorSearch.toLowerCase())
                  ).map(creator => {
                    const isCollapsed = collapsedCreators.has(creator.id);
                    return (
                      <div key={creator.id} style={{
                        padding: '16px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        backgroundColor: creator.status === 'banned' ? '#fee2e2' : creator.shadowBanned ? '#fef3c7' : '#fffbeb',
                        transition: 'all 0.3s ease',
                        boxShadow: isCollapsed ? '0 1px 3px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        {/* Header - Always Visible */}
                        <div style={{
                          display: 'flex',
                          gap: '16px',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => {
                          setCollapsedCreators(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(creator.id)) newSet.delete(creator.id);
                            else newSet.add(creator.id);
                            return newSet;
                          });
                        }}>
                          {/* Profile Picture - Smaller in Collapsed */}
                          <div style={{
                            width: isCollapsed ? '64px' : '100px',
                            height: isCollapsed ? '64px' : '100px',
                            borderRadius: '50%',
                            backgroundColor: '#e5e7eb',
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: '3px solid #f59e0b',
                            transition: 'all 0.3s ease'
                          }}>
                            {creator.image ? (
                              <img src={creator.image} alt={creator.name} style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }} />
                            ) : (
                              <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#d1d5db',
                                color: '#fff',
                                fontSize: '24px',
                                fontWeight: 'bold'
                              }}>
                                {(creator.name || 'C')[0].toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Header Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: isCollapsed ? '16px' : '18px', fontWeight: 'bold', transition: 'font-size 0.3s' }}>
                                  <Crown size={16} style={{ marginRight: '6px' }} /> {creator.name}
                                </h3>
                                <p style={{ margin: '0', color: '#666', fontSize: '13px' }}>
                                  @{creator.email.split('@')[0]}
                                </p>
                              </div>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flexShrink: 0
                              }}>
                                <span style={{
                                  padding: '4px 8px',
                                  backgroundColor: creator.status === 'banned' ? '#dc2626' : creator.shadowBanned ? '#f59e0b' : '#10b981',
                                  color: 'white',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  borderRadius: '4px'
                                }}>
                                  {creator.status === 'banned' ? '🚫 Banned' : creator.shadowBanned ? '👁️ Shadow' : '✓ Active'}
                                </span>
                                <ChevronDown size={20} style={{
                                  transform: isCollapsed ? 'rotate(0deg)' : 'rotate(-180deg)',
                                  transition: 'transform 0.3s ease',
                                  color: '#6b7280'
                                }} />
                              </div>
                            </div>

                            {/* Price Display in Collapsed Header */}
                            {isCollapsed && (
                              <p style={{ margin: '6px 0 0 0', color: '#f59e0b', fontSize: '13px', fontWeight: 'bold' }}>
                                ${creator.price || '0'} / Request
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Expandable Content */}
                        {!isCollapsed && (
                          <div style={{ 
                            marginTop: '16px',
                            paddingTop: '16px',
                            borderTop: '1px solid rgba(229, 231, 235, 0.5)',
                            animation: 'fadeIn 0.3s ease'
                          }}>
                            {/* Status Tags & Action Button */}
                            <div style={{
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'center',
                              marginBottom: '12px',
                              flexWrap: 'wrap'
                            }}>
                              {(creator.status === 'banned' || creator.shadowBanned || creator.warnings > 0) && (
                                <>
                                  {creator.status === 'banned' && (
                                    <span style={{
                                      padding: '4px 10px',
                                      backgroundColor: '#fee2e2',
                                      color: '#dc2626',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      borderRadius: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      🚫 Banned
                                    </span>
                                  )}
                                  {creator.shadowBanned && (
                                    <span style={{
                                      padding: '4px 10px',
                                      backgroundColor: '#fef3c7',
                                      color: '#92400e',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      borderRadius: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      👁️ Shadowbanned
                                    </span>
                                  )}
                                  {creator.warnings > 0 && (
                                    <span style={{
                                      padding: '4px 10px',
                                      backgroundColor: '#fef08a',
                                      color: '#b45309',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      borderRadius: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      ⚠️ {creator.warnings} Warning{creator.warnings > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </>
                              )}
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUserActionModal({ isOpen: true, userId: creator.id, action: null });
                                  setReasonModal({ isOpen: true, action: 'user', itemId: null, itemType: null, reason: '' });
                                }}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: 'white',
                                  color: '#dc2626',
                                  border: '2px solid #dc2626',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  transition: 'all 0.2s',
                                  marginLeft: 'auto'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#dc2626';
                                  e.target.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = 'white';
                                  e.target.style.color = '#dc2626';
                                }}
                              >
                                Take Action
                              </button>
                            </div>

                            {/* Bio */}
                            {creator.bio && (
                              <p style={{ margin: '8px 0', color: '#666', fontSize: '13px', fontStyle: 'italic', paddingLeft: '8px', borderLeft: '3px solid #f59e0b' }}>
                                "{creator.bio}"
                              </p>
                            )}

                            {/* Creator Details Grid */}
                            <div style={{ 
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gap: '16px',
                              marginTop: '12px'
                            }}>
                              <div style={{ padding: '10px', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '6px' }}>
                                <span style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>EMAIL</span>
                                <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13px' }}>{creator.email}</p>
                              </div>
                              <div style={{ padding: '10px', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '6px' }}>
                                <span style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>PRICE PER REQUEST</span>
                                <p style={{ margin: '4px 0 0', color: '#f59e0b', fontSize: '14px', fontWeight: 'bold' }}>
                                  ${creator.price || '0'}
                                </p>
                              </div>
                              <div style={{ padding: '10px', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '6px' }}>
                                <span style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>CREATOR SINCE</span>
                                <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13px' }}>
                                  {new Date(creator.creatorSince).toLocaleDateString()}
                                </p>
                              </div>
                              <div style={{ padding: '10px', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '6px' }}>
                                <span style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>STREAK</span>
                                <p style={{ margin: '4px 0 0', color: '#f59e0b', fontSize: '14px', fontWeight: 'bold' }}>
                                  🔥 {creator.streak || 0}
                                </p>
                              </div>
                            </div>

                            {creator.warnings > 0 && (
                              <div style={{ 
                                marginTop: '12px',
                                padding: '10px',
                                backgroundColor: 'rgba(220, 38, 38, 0.05)',
                                border: '1px solid rgba(220, 38, 38, 0.2)',
                                borderRadius: '6px',
                                color: '#dc2626',
                                fontSize: '13px'
                              }}>
                                ⚠️ {creator.warnings} {creator.warnings === 1 ? 'warning' : 'warnings'}
                              </div>
                            )}

                            {/* Intro Video */}
                            {creator.introVideo && (
                              <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '6px' }}>
                                <span style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>INTRO VIDEO</span>
                                <p style={{ margin: '4px 0 0', color: '#3b82f6', fontSize: '12px' }}>
                                  <a href={creator.introVideo} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', cursor: 'pointer' }}>
                                    View Video →
                                  </a>
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Floating Navigation Buttons for Creators */}
              <div style={{
                position: 'fixed',
                right: '20px',
                bottom: '90px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                zIndex: 40
              }}>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  title="Go to top"
                  style={{
                    padding: '12px 12px',
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
                    width: '44px',
                    height: '44px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#4338ca';
                    e.target.style.boxShadow = '0 6px 20px rgba(79,70,229,0.4)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#4f46e5';
                    e.target.style.boxShadow = '0 4px 12px rgba(79,70,229,0.3)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <ChevronUp size={20} />
                </button>
                <button
                  onClick={() => {
                    const lastPos = savedScrollPositions['creators'] || 0;
                    if (lastPos > 0) {
                      window.scrollTo({ top: lastPos, behavior: 'smooth' });
                    }
                  }}
                  title="Go back to last position"
                  style={{
                    padding: '12px 12px',
                    backgroundColor: (savedScrollPositions['creators'] || 0) > 0 ? '#4f46e5' : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (savedScrollPositions['creators'] || 0) > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: (savedScrollPositions['creators'] || 0) > 0 ? '0 4px 12px rgba(79,70,229,0.3)' : 'none',
                    width: '44px',
                    height: '44px',
                    opacity: (savedScrollPositions['creators'] || 0) > 0 ? 1 : 0.6
                  }}
                  onMouseEnter={(e) => {
                    if ((savedScrollPositions['creators'] || 0) > 0) {
                      e.target.style.backgroundColor = '#4338ca';
                      e.target.style.boxShadow = '0 6px 20px rgba(79,70,229,0.4)';
                      e.target.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = (savedScrollPositions['creators'] || 0) > 0 ? '#4f46e5' : '#d1d5db';
                    e.target.style.boxShadow = (savedScrollPositions['creators'] || 0) > 0 ? '0 4px 12px rgba(79,70,229,0.3)' : 'none';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <ChevronDown size={20} />
                </button>
              </div>
            </div>
          )}
          {activeTab === 'reports' && (
            <div>
              {/* Search Bar */}
              <div style={{
                marginBottom: '12px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Search size={18} style={{
                  position: 'absolute',
                  left: '12px',
                  color: '#6b7280',
                  pointerEvents: 'none'
                }} />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    marginBottom: '12px'
                  }}
                />
              </div>

              {/* Report Category Tabs */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px',
                flexWrap: 'wrap',
                paddingBottom: '12px',
                borderBottom: '2px solid #e5e7eb'
              }}>
                {['all', 'users', 'creators', 'requests', 'ads', 'videos'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setReportCategory(cat)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: reportCategory === cat ? '#3b82f6' : 'transparent',
                      color: reportCategory === cat ? 'white' : '#666',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: reportCategory === cat ? 'bold' : 'normal',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (reportCategory !== cat) e.target.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      if (reportCategory !== cat) e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              {/* Filtered Reports */}
              {reports.length === 0 ? (
                <div style={{
                  padding: '48px 32px',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  borderRadius: '10px',
                  color: '#6b7280',
                  border: '1px solid #d1d5db'
                }}>
                  <div style={{ 
                    width: '72px',
                    height: '72px',
                    backgroundColor: 'rgba(79,70,229,0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <CheckCircle size={36} style={{ color: '#4f46e5' }} />
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>No Reports in Queue</p>
                  <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>All reports have been processed</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {reports.filter(r => 
                    (r.title || '').toLowerCase().includes(reportSearch.toLowerCase()) ||
                    (r.reason || '').toLowerCase().includes(reportSearch.toLowerCase())
                  ).map(report => {
                    const reportedVideo = videos.find(v => v.id === report.videoId);
                    const isCollapsed = collapsedReports.has(report.id);
                    return (
                      <div key={report.id} style={{
                        padding: '16px',
                        border: '2px solid #fee2e2',
                        borderRadius: '8px',
                        backgroundColor: '#fef2f2',
                        transition: 'all 0.3s ease',
                        boxShadow: isCollapsed ? '0 1px 3px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        {/* Header - Always Visible */}
                        <div style={{
                          display: 'flex',
                          gap: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          alignItems: 'flex-start'
                        }}
                        onClick={() => {
                          setCollapsedReports(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(report.id)) newSet.delete(report.id);
                            else newSet.add(report.id);
                            return newSet;
                          });
                        }}>
                          {/* Video Thumbnail */}
                          {reportedVideo && (
                            <div style={{
                              flexShrink: 0,
                              width: isCollapsed ? '70px' : '100px',
                              height: isCollapsed ? '70px' : '100px',
                              backgroundColor: '#e5e7eb',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              border: '2px solid #ef4444',
                              transition: 'all 0.3s ease'
                            }}>
                              <img 
                                src={reportedVideo.imageUrl} 
                                alt={reportedVideo.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          )}
                          
                          {/* Report Summary */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: isCollapsed ? '14px' : '16px', fontWeight: 'bold', transition: 'font-size 0.3s' }}>
                                  {report.title || report.videoId}
                                </h3>
                                {reportedVideo && (
                                  <p style={{ margin: '0', color: '#666', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    📺 {reportedVideo.title}
                                  </p>
                                )}
                              </div>
                              <ChevronDown size={20} style={{
                                transform: isCollapsed ? 'rotate(0deg)' : 'rotate(-180deg)',
                                transition: 'transform 0.3s ease',
                                color: '#ef4444',
                                flexShrink: 0,
                                marginLeft: '8px'
                              }} />
                            </div>

                            {/* Reason Preview (Always visible) */}
                            <p style={{ margin: '6px 0 0', color: '#7f1d1d', fontSize: '12px', fontWeight: '600' }}>
                              {report.reason.substring(0, isCollapsed ? 50 : 200)}{report.reason.length > (isCollapsed ? 50 : 200) ? '...' : ''}
                            </p>
                          </div>
                        </div>

                        {/* Expandable Content */}
                        {!isCollapsed && (
                          <div style={{ 
                            marginTop: '16px',
                            paddingTop: '16px',
                            borderTop: '1px solid rgba(239, 68, 68, 0.2)',
                            animation: 'fadeIn 0.3s ease'
                          }}>
                            {/* Full Reason */}
                            <div style={{ marginBottom: '12px' }}>
                              <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '600', color: '#7f1d1d' }}>
                                ⚠️ Full Reason:
                              </p>
                              <p style={{ margin: '0', color: '#666', fontSize: '13px', paddingLeft: '12px', borderLeft: '3px solid #ef4444', lineHeight: '1.5' }}>
                                {report.reason}
                              </p>
                            </div>

                            {/* Reporter & Video Info Grid */}
                            <div style={{ 
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gap: '12px',
                              marginBottom: '12px'
                            }}>
                              <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '6px' }}>
                                <span style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>REPORTED BY</span>
                                <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13px', wordBreak: 'break-all' }}>
                                  {report.reporterEmail || report.reporterId || 'anonymous'}
                                </p>
                              </div>
                              <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '6px' }}>
                                <span style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>REPORT DATE</span>
                                <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13px' }}>
                                  {new Date(report.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              {reportedVideo && (
                                <>
                                  <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '6px' }}>
                                    <span style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>VIDEO AUTHOR</span>
                                    <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13px' }}>
                                      {reportedVideo.author}
                                    </p>
                                  </div>
                                  <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '6px' }}>
                                    <span style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>VIDEO ID</span>
                                    <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13px', fontFamily: 'monospace' }}>
                                      {reportedVideo.id}
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Evidence Files */}
                            {report.evidenceFiles && report.evidenceFiles.length > 0 && (
                              <div style={{ marginBottom: '12px' }}>
                                <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#7f1d1d' }}>
                                  📎 Evidence Files ({report.evidenceFiles.length}):
                                </p>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingLeft: '8px' }}>
                                  {report.evidenceFiles.map((file, idx) => (
                                    <a 
                                      key={idx}
                                      href={`${getStaffBackendBaseUrl()}/${file.path}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        padding: '6px 10px',
                                        backgroundColor: '#fff',
                                        border: '1px solid #ef4444',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        color: '#ef4444',
                                        fontWeight: '600',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#ef4444';
                                        e.currentTarget.style.color = 'white';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#fff';
                                        e.currentTarget.style.color = '#ef4444';
                                      }}
                                    >
                                      📄 {file.originalName}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            {reportedVideo && (
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAdVideo(reportedVideo.id);
                                  }}
                                  style={{
                                    padding: '8px 14px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = '#1e40af'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                                >
                                  View Video
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAdVideo(reportedVideo.id);
                                    setActiveTab('ads');
                                  }}
                                  style={{
                                    padding: '8px 14px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = '#047857'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                                >
                                  Edit Overlays
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const deleteVideo = async () => {
                                      try {
                                        await fetch(`${getStaffBackendBaseUrl()}/staff/shadow-delete/${reportedVideo.id}`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ employeeId: staffSession?.id || 1000, reason: `Report action: ${report.reason}` })
                                        });
                                        setReports(reports.filter(r => r.id !== report.id));
                                      } catch (err) {
                                        console.error('Delete failed', err);
                                      }
                                    };
                                    deleteVideo();
                                  }}
                                  style={{
                                    padding: '8px 14px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                                >
                                  Shadow Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Floating Navigation Buttons for Reports */}
              <div style={{
                position: 'fixed',
                right: '20px',
                bottom: '90px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                zIndex: 40
              }}>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  title="Go to top"
                  style={{
                    padding: '12px 12px',
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
                    width: '44px',
                    height: '44px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#4338ca';
                    e.target.style.boxShadow = '0 6px 20px rgba(79,70,229,0.4)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#4f46e5';
                    e.target.style.boxShadow = '0 4px 12px rgba(79,70,229,0.3)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <ChevronUp size={20} />
                </button>
                <button
                  onClick={() => {
                    const lastPos = savedScrollPositions['reports'] || 0;
                    if (lastPos > 0) {
                      window.scrollTo({ top: lastPos, behavior: 'smooth' });
                    }
                  }}
                  title="Go back to last position"
                  style={{
                    padding: '12px 12px',
                    backgroundColor: (savedScrollPositions['reports'] || 0) > 0 ? '#4f46e5' : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (savedScrollPositions['reports'] || 0) > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: (savedScrollPositions['reports'] || 0) > 0 ? '0 4px 12px rgba(79,70,229,0.3)' : 'none',
                    width: '44px',
                    height: '44px',
                    opacity: (savedScrollPositions['reports'] || 0) > 0 ? 1 : 0.6
                  }}
                  onMouseEnter={(e) => {
                    if ((savedScrollPositions['reports'] || 0) > 0) {
                      e.target.style.backgroundColor = '#4338ca';
                      e.target.style.boxShadow = '0 6px 20px rgba(79,70,229,0.4)';
                      e.target.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = (savedScrollPositions['reports'] || 0) > 0 ? '#4f46e5' : '#d1d5db';
                    e.target.style.boxShadow = (savedScrollPositions['reports'] || 0) > 0 ? '0 4px 12px rgba(79,70,229,0.3)' : 'none';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <ChevronDown size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Shadow Deleted Tab */}
          {activeTab === 'shadowDeleted' && (
            <div>
              {/* Search Bar */}
              <div style={{
                marginBottom: '12px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Search size={18} style={{
                  position: 'absolute',
                  left: '12px',
                  color: '#6b7280',
                  pointerEvents: 'none'
                }} />
                <input
                  type="text"
                  placeholder="Search shadow-deleted..."
                  value={shadowDeletedSearch}
                  onChange={(e) => setShadowDeletedSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    marginBottom: '12px'
                  }}
                />
              </div>

              {shadowDeleted.length === 0 ? (
                <div style={{
                  padding: '48px 32px',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  borderRadius: '10px',
                  color: '#6b7280',
                  border: '1px solid #d1d5db'
                }}>
                  <div style={{ 
                    width: '72px',
                    height: '72px',
                    backgroundColor: 'rgba(79,70,229,0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <Eye size={36} style={{ color: '#4f46e5' }} />
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>No Shadow-Deleted Videos</p>
                  <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>Shadow-deleted content management</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {shadowDeleted.filter(item =>
                    (item.videoId || '').toLowerCase().includes(shadowDeletedSearch.toLowerCase()) ||
                    (item.reason || '').toLowerCase().includes(shadowDeletedSearch.toLowerCase())
                  ).map((item, idx) => (
                    <div key={idx} style={{
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: '#fef2f2'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                            {item.videoId}
                          </h3>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                            Reason: {item.reason}
                          </p>
                          <p style={{ margin: '4px 0', color: '#999', fontSize: '12px' }}>
                            Deleted by: Staff #{item.deletedBy}
                          </p>
                          <p style={{ margin: '4px 0', color: '#999', fontSize: '12px' }}>
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => alert('Restore functionality coming soon')}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          Restore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Account Approvals Tab (Admin Only) */}
          {activeTab === 'approvals' && staffSession.role === 'administrator' && (
            <div>
              {/* Search Bar */}
              <div style={{marginBottom: '12px', position: 'relative', display: 'flex', alignItems: 'center'}}>
                <Search size={18} style={{position: 'absolute', left: '12px', color: '#6b7280', pointerEvents: 'none'}} />
                <input type="text" placeholder="Search pending accounts..." value={approvalsSearch} onChange={(e) => setApprovalsSearch(e.target.value)} 
                  style={{width: '100%', padding: '10px 12px 10px 40px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', marginBottom: '12px'}} />
              </div>
              {pendingAccounts.length === 0 ? (
                <div style={{
                  padding: '48px 32px',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  borderRadius: '10px',
                  color: '#6b7280',
                  border: '1px solid #d1d5db'
                }}>
                  <div style={{ 
                    width: '72px',
                    height: '72px',
                    backgroundColor: 'rgba(79,70,229,0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <Clock size={36} style={{ color: '#4f46e5' }} />
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>No Pending Requests</p>
                  <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>All account requests have been processed</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingAccounts.filter(account => (account.name || '').toLowerCase().includes(approvalsSearch.toLowerCase()) || (account.email || '').toLowerCase().includes(approvalsSearch.toLowerCase())).map(account => (
                    <div key={account.employeeId} style={{
                      padding: '16px',
                      border: '1px solid #fbbf24',
                      borderRadius: '8px',
                      backgroundColor: '#fffbeb',
                      overflow: 'hidden'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                            {account.name}
                          </h3>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                            Email: {account.email}
                          </p>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                            Employee ID: {account.employeeId}
                          </p>
                          <p style={{ margin: '4px 0', color: '#999', fontSize: '12px' }}>
                            Applied: {new Date(account.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0, minWidth: '180px' }}>
                          <button
                            type="button"
                            onClick={() => handleApproveAccount(account, true)}
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = 'none';
                            }}
                            style={{
                              padding: '8px 12px',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '700',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <span>✓</span> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveAccount(account, false)}
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = 'none';
                            }}
                            style={{
                              padding: '8px 12px',
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '700',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <span>✕</span> Deny
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Staff Management Tab */}
          {activeTab === 'staffManagement' && staffSession.role === 'administrator' && (
            <div>
              {/* Search Bar */}
              <div style={{marginBottom: '12px', position: 'relative', display: 'flex', alignItems: 'center'}}>
                <Search size={18} style={{position: 'absolute', left: '12px', color: '#6b7280', pointerEvents: 'none'}} />
                <input type="text" placeholder="Search staff members..." value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)} 
                  style={{width: '100%', padding: '10px 12px 10px 40px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', marginBottom: '12px'}} />
              </div>
              {staffMembers.length === 0 ? (
                <div style={{
                  padding: '48px 32px',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  borderRadius: '10px',
                  color: '#6b7280',
                  border: '1px solid #d1d5db'
                }}>
                  <div style={{ 
                    width: '72px',
                    height: '72px',
                    backgroundColor: 'rgba(79,70,229,0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <Users size={36} style={{ color: '#4f46e5' }} />
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>No Staff Members</p>
                  <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>No staff members found</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {staffMembers.filter(member => (member.name || '').toLowerCase().includes(staffSearch.toLowerCase()) || (member.email || '').toLowerCase().includes(staffSearch.toLowerCase())).map(member => (
                    <div key={member.id} style={{
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: member.id === staffSession.id ? '#eff6ff' : 'white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <h3 style={{ margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                              {member.name}
                            </h3>
                            {member.id === 1000 && (
                              <span style={{ padding: '2px 8px', backgroundColor: '#dc2626', color: 'white', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px' }}>
                                ADMIN
                              </span>
                            )}
                            {member.id === staffSession.id && (
                              <span style={{ padding: '2px 8px', backgroundColor: '#0369a1', color: 'white', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px' }}>
                                YOU
                              </span>
                            )}
                            {member.approvalAuthority && member.id !== 1000 && member.id !== staffSession.id && (
                              <span style={{ padding: '2px 8px', backgroundColor: '#7c3aed', color: 'white', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px' }}>
                                APPROVER
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                            Email: {member.email}
                          </p>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                            Employee ID: {member.id}
                          </p>
                          <p style={{ margin: '4px 0', color: '#999', fontSize: '12px' }}>
                            Created: {new Date(member.createdAt).toLocaleString()}
                          </p>
                          <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {member.permissions && Object.entries(member.permissions).filter(([_, val]) => val).map(([perm, _]) => (
                              <span key={perm} style={{ padding: '2px 6px', backgroundColor: '#dbeafe', color: '#0369a1', fontSize: '11px', borderRadius: '3px', fontWeight: '500' }}>
                                {perm.charAt(0).toUpperCase() + perm.slice(1).replace(/([A-Z])/g, ' $1')}
                              </span>
                            ))}
                          </div>
                        </div>
                        {member.id !== staffSession.id && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => {
                                // Create permissions object with all permissions, defaulting to true if not set
                                const fullPermissions = {};
                                Object.keys(ALL_PERMISSIONS).forEach(key => {
                                  fullPermissions[key] = member.permissions?.[key] !== false; // Default to true
                                });
                                setStaffPermissionsModal({
                                  isOpen: true,
                                  member,
                                  permissions: fullPermissions,
                                  grantAdmin: member.approvalAuthority || false,
                                  blocked: member.status === 'blocked'
                                });
                              }}
                              style={{
                                padding: '8px 12px',
                                backgroundColor: '#4f46e5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#4338ca'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#4f46e5'}
                            >
                              Edit Permissions
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

        {/* Action Modal */}
      {actionModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 24px 0', color: '#1f2937' }}>
              Choose Action
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => {
                  // Open reason modal using current actionModal values (clear previous errors), then close the action modal
                  setError('');
                  setReasonModal({ isOpen: true, action: 'hide', itemId: actionModal.itemId, itemType: actionModal.itemType, reason: '' });
                  setActionModal({ isOpen: false, itemId: null, itemType: null });
                }}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                <EyeOff size={18} />
                Hide
              </button>
              <button
                onClick={() => {
                  // Open reason modal using current actionModal values (clear previous errors), then close the action modal
                  setError('');
                  setReasonModal({ isOpen: true, action: 'delete', itemId: actionModal.itemId, itemType: actionModal.itemType, reason: '' });
                  setActionModal({ isOpen: false, itemId: null, itemType: null });
                }}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                <Trash2 size={18} />
                Delete Permanently
              </button>

              {/* Quick actions (one-click without reason) */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  onClick={() => {
                    // close the modal then run quick hide
                    setActionModal({ isOpen: false, itemId: null, itemType: null });
                    if (actionModal.itemType === 'video') handleHideVideo(actionModal.itemId);
                    else if (actionModal.itemType === 'request') handleHideRequest(actionModal.itemId);
                    else if (actionModal.itemType === 'comment') handleHideComment(actionModal.itemId);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    backgroundColor: 'transparent',
                    color: '#b45309',
                    border: '1px dashed #f59e0b',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  Quick Hide
                </button>
                <button
                  onClick={() => {
                    setActionModal({ isOpen: false, itemId: null, itemType: null });
                    if (actionModal.itemType === 'video') handleDeleteVideo(actionModal.itemId);
                    else if (actionModal.itemType === 'request') handleDeleteRequest(actionModal.itemId);
                    else if (actionModal.itemType === 'comment') handleDeleteComment(actionModal.itemId);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    backgroundColor: 'transparent',
                    color: '#9f1239',
                    border: '1px dashed #ef4444',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  Quick Delete
                </button>
              </div>

              <button
                onClick={() => setActionModal({ isOpen: false, itemId: null, itemType: null })}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reason Modal */}
      {reasonModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1f2937' }}>
              {reasonModal.action === 'hide' ? 'Hide ' : 'Delete '}
              {reasonModal.itemType}
            </h2>
            <p style={{ fontSize: '14px', color: '#666', margin: '0 0 24px 0' }}>
              Please provide a reason for this action
            </p>
            <textarea
              autoFocus
              aria-label="Reason for action"
              value={reasonModal.reason}
              onChange={(e) => setReasonModal({ ...reasonModal, reason: e.target.value })}
              placeholder="Enter your reason here..."
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                minHeight: '120px',
                marginBottom: '24px',
                resize: 'none'
              }}
            />
            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  if (reasonModal.action === 'hide') {
                    if (reasonModal.itemType === 'video') handleHideVideo(reasonModal.itemId);
                    else if (reasonModal.itemType === 'request') handleHideRequest(reasonModal.itemId);
                    else if (reasonModal.itemType === 'comment') handleHideComment(reasonModal.itemId);
                  } else {
                    if (reasonModal.itemType === 'video') handleDeleteVideo(reasonModal.itemId);
                    else if (reasonModal.itemType === 'request') handleDeleteRequest(reasonModal.itemId);
                    else if (reasonModal.itemType === 'comment') handleDeleteComment(reasonModal.itemId);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: reasonModal.action === 'hide' ? '#f59e0b' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                {reasonModal.action === 'hide' ? 'Hide ' : 'Delete '}
              </button>
              <button
                onClick={() => setReasonModal({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' })}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Confirmation Modal */}
      {undoModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#1f2937' }}>
              Confirm Undo
            </h2>
            <p style={{ fontSize: '14px', color: '#666', margin: '0 0 24px 0' }}>
              {undoModal.action === 'unhide' 
                ? `Are you sure you want to unhide this ${undoModal.itemType}? It will become visible again.` 
                : `Are you sure you want to restore this ${undoModal.itemType}? It will be available again.`}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  if (undoModal.action === 'unhide') {
                    if (undoModal.itemType === 'video') {
                      handleUndoHideVideo(undoModal.itemId);
                    } else if (undoModal.itemType === 'request') {
                      handleUndoHideRequest(undoModal.itemId);
                    } else if (undoModal.itemType === 'comment') {
                      handleUndoHideComment(undoModal.itemId);
                    }
                  } else {
                    if (undoModal.itemType === 'video') {
                      handleUndoDeleteVideo(undoModal.itemId);
                    } else if (undoModal.itemType === 'request') {
                      handleUndoDeleteRequest(undoModal.itemId);
                    } else if (undoModal.itemType === 'comment') {
                      handleUndoDeleteComment(undoModal.itemId);
                    }
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                {undoModal.action === 'unhide' ? 'Unhide' : 'Restore'}
              </button>
              <button
                onClick={() => setUndoModal({ isOpen: false, action: null, itemId: null, itemType: null })}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification (global) */}
      {toast && (
        <div style={toast.position === 'top' ? { position: 'fixed', left: '50%', transform: 'translateX(-50%)', top: '20px', zIndex: 3000, minWidth: '320px' } : { position: 'fixed', right: '20px', bottom: '20px', zIndex: 2000, minWidth: '260px' }}>
          {toast.type === 'success' ? (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'linear-gradient(90deg,#16a34a,#10b981)', padding: '12px', borderRadius: '8px', color: 'white', boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Gift size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{toast.title || 'Success'}</div>
                <div style={{ fontSize: '13px', opacity: 0.95 }}>{toast.message}</div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'linear-gradient(90deg,#ef4444,#f97316)', padding: '12px', borderRadius: '8px', color: 'white', boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>{toast.title || 'Error'}</div>
              <div style={{ fontSize: '13px', opacity: 0.95 }}>{toast.message}</div>
            </div>
          )}
        </div>
      )}
      {/* User Action Modal (for reports - warn/ban/shadow ban/delete users) */}
      {userActionModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {!selectedActionType ? (
              <>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1f2937' }}>
                  Apply Action to User
                </h2>
                <p style={{ fontSize: '14px', color: '#666', margin: '0 0 24px 0' }}>
                  Select an action to apply to this user
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={() => setSelectedActionType('warn')}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'opacity 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    <AlertTriangle size={16} style={{ marginRight: '6px' }} /> Send Warning
                  </button>
                  <button
                    onClick={() => setSelectedActionType('ban')}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'opacity 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    <Ban size={16} style={{ marginRight: '6px' }} /> Ban User
                  </button>
                  <button
                    onClick={() => setSelectedActionType('shadowban')}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'opacity 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    <EyeOff size={16} style={{ marginRight: '6px' }} /> Shadow Ban User
                  </button>
                  <button
                    onClick={() => setSelectedActionType('delete')}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'opacity 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    <Trash size={16} style={{ marginRight: '6px' }} /> Delete User Account
                  </button>
                  <button
                    onClick={() => {
                      setUserActionModal({ isOpen: false, userId: null, action: null });
                      setSelectedActionType(null);
                      setNotificationPreview(null);
                      setBanType('permanent');
                      setBanDuration({ value: 7, unit: 'days' });
                    }}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#e5e7eb',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1f2937' }}>
                  {selectedActionType === 'warn' && 'Send Warning'}
                  {selectedActionType === 'ban' && '🚫 Ban User'}
                  {selectedActionType === 'shadowban' && '👁️ Shadow Ban User'}
                  {selectedActionType === 'delete' && '🗑️ Delete User Account'}
                </h2>
                <p style={{ fontSize: '14px', color: '#666', margin: '0 0 16px 0' }}>
                  Select a reason or provide a custom one. The preview below shows exactly how users will see this.
                </p>

                {/* Ban Type Selector (Only for ban action) */}
                {selectedActionType === 'ban' && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', margin: '0 0 8px 0' }}>BAN TYPE</p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => setBanType('temporary')}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: banType === 'temporary' ? '#ef4444' : '#f3f4f6',
                          color: banType === 'temporary' ? 'white' : '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s'
                        }}
                      >
                        ⏰ Temporary
                      </button>
                      <button
                        onClick={() => setBanType('permanent')}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: banType === 'permanent' ? '#ef4444' : '#f3f4f6',
                          color: banType === 'permanent' ? 'white' : '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s'
                        }}
                      >
                        ♾️ Permanent
                      </button>
                    </div>
                  </div>
                )}

                {/* Ban Duration Selector (Only for temporary bans) */}
                {selectedActionType === 'ban' && banType === 'temporary' && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', margin: '0 0 8px 0' }}>BAN DURATION</p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="number"
                        value={banDuration.value}
                        onChange={(e) => setBanDuration({ ...banDuration, value: parseInt(e.target.value) || 1 })}
                        min="1"
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                          fontWeight: '600'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          {['hours', 'days', 'weeks', 'months'].map((unit) => (
                            <button
                              key={unit}
                              onClick={() => setBanDuration({ ...banDuration, unit })}
                              style={{
                                padding: '10px 12px',
                                backgroundColor: banDuration.unit === unit ? '#ef4444' : '#f3f4f6',
                                color: banDuration.unit === unit ? 'white' : '#374151',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: banDuration.unit === unit ? '700' : '600',
                                transition: 'all 0.2s',
                                textTransform: 'capitalize'
                              }}
                              onMouseEnter={(e) => {
                                if (banDuration.unit !== unit) {
                                  e.target.style.backgroundColor = '#e5e7eb';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (banDuration.unit !== unit) {
                                  e.target.style.backgroundColor = '#f3f4f6';
                                }
                              }}
                            >
                              {unit}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reason Templates */}
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', margin: '0 0 8px 0' }}>COMMON REASONS</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedActionType === 'warn' && [
                      'Violating community guidelines',
                      'Spam or repetitive posting',
                      'Misleading or false information',
                      'Inappropriate language or behavior'
                    ].map((template) => (
                      <button
                        key={template}
                        onClick={() => {
                          setReasonModal({ ...reasonModal, reason: template });
                          handleNotificationPreview(selectedActionType, template);
                        }}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: reasonModal.reason === template ? '#f59e0b' : '#f3f4f6',
                          color: reasonModal.reason === template ? 'white' : '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          textAlign: 'left',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (reasonModal.reason !== template) {
                            e.target.style.backgroundColor = '#e5e7eb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (reasonModal.reason !== template) {
                            e.target.style.backgroundColor = '#f3f4f6';
                          }
                        }}
                      >
                        {template}
                      </button>
                    ))}
                    {selectedActionType === 'ban' && [
                      'Severe violation of terms of service',
                      'Repeated harassment or abuse',
                      'Copyright infringement',
                      'Illegal activity detected'
                    ].map((template) => (
                      <button
                        key={template}
                        onClick={() => {
                          setReasonModal({ ...reasonModal, reason: template });
                          handleNotificationPreview(selectedActionType, template);
                        }}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: reasonModal.reason === template ? '#ef4444' : '#f3f4f6',
                          color: reasonModal.reason === template ? 'white' : '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          textAlign: 'left',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (reasonModal.reason !== template) {
                            e.target.style.backgroundColor = '#e5e7eb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (reasonModal.reason !== template) {
                            e.target.style.backgroundColor = '#f3f4f6';
                          }
                        }}
                      >
                        {template}
                      </button>
                    ))}
                    {selectedActionType === 'shadowban' && [
                      'Content violates platform guidelines',
                      'Suspected artificial engagement',
                      'Low-quality or repetitive content',
                      'Restricted for review'
                    ].map((template) => (
                      <button
                        key={template}
                        onClick={() => {
                          setReasonModal({ ...reasonModal, reason: template });
                          handleNotificationPreview(selectedActionType, template);
                        }}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: reasonModal.reason === template ? '#6b7280' : '#f3f4f6',
                          color: reasonModal.reason === template ? 'white' : '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          textAlign: 'left',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (reasonModal.reason !== template) {
                            e.target.style.backgroundColor = '#e5e7eb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (reasonModal.reason !== template) {
                            e.target.style.backgroundColor = '#f3f4f6';
                          }
                        }}
                      >
                        {template}
                      </button>
                    ))}
                    {selectedActionType === 'delete' && [
                      'Severe violation of terms of service',
                      'Repeated policy violations after warnings',
                      'Harmful or illegal content',
                      'Account used for malicious purposes'
                    ].map((template) => (
                      <button
                        key={template}
                        onClick={() => {
                          setReasonModal({ ...reasonModal, reason: template });
                          handleNotificationPreview(selectedActionType, template);
                        }}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: reasonModal.reason === template ? '#8b5cf6' : '#f3f4f6',
                          color: reasonModal.reason === template ? 'white' : '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          textAlign: 'left',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (reasonModal.reason !== template) {
                            e.target.style.backgroundColor = '#e5e7eb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (reasonModal.reason !== template) {
                            e.target.style.backgroundColor = '#f3f4f6';
                          }
                        }}
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Reason Input */}
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', margin: '0 0 8px 0' }}>CUSTOM REASON (OPTIONAL)</p>
                  <textarea
                    value={reasonModal.reason}
                    onChange={(e) => {
                      setReasonModal({ ...reasonModal, reason: e.target.value });
                      handleNotificationPreview(selectedActionType, e.target.value);
                    }}
                    placeholder="Or type a custom reason here..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      minHeight: '80px',
                      marginBottom: '16px',
                      resize: 'none'
                    }}
                  />
                </div>

                {/* Notification Preview */}
                {notificationPreview && (
                  <div style={{
                    marginBottom: '16px'
                  }}>
                    <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', margin: '0 0 12px 0' }}>HOW USERS WILL SEE THIS</p>
                    <div style={{
                      backgroundColor: '#f0f4f8',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        border: `1px solid ${notificationPreview.color}33`
                      }}>
                        {/* Close Button */}
                        <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                          <span style={{
                            fontSize: '20px',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}>✕</span>
                        </div>

                        {/* Icon */}
                        <div style={{
                          textAlign: 'center',
                          marginBottom: '16px'
                        }}>
                          <div style={{
                            fontSize: '48px',
                            width: '70px',
                            height: '70px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: notificationPreview.color,
                            borderRadius: '50%',
                            color: 'white',
                            margin: '0 auto',
                            boxShadow: `0 4px 12px ${notificationPreview.color}40`
                          }}>
                            {notificationPreview.iconType === 'warn' && <AlertTriangle size={28} color="white" />}
                            {notificationPreview.iconType === 'ban' && <Ban size={28} color="white" />}
                            {notificationPreview.iconType === 'shadowban' && <EyeOff size={28} color="white" />}
                            {notificationPreview.iconType === 'delete' && <Trash size={28} color="white" />}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: '700',
                          margin: '0 0 12px 0',
                          color: '#1f2937',
                          textAlign: 'center',
                          letterSpacing: '-0.5px'
                        }}>
                          {notificationPreview.title}
                        </h3>

                        {/* Message */}
                        <p style={{
                          fontSize: '14px',
                          color: '#4b5563',
                          margin: '0',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap',
                          textAlign: 'center'
                        }}>
                          {notificationPreview.message}
                        </p>

                        {/* Action Buttons */}
                        {selectedActionType === 'warn' && (
                          <button style={{
                            width: '100%',
                            padding: '12px 16px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginTop: '16px',
                            transition: 'opacity 0.2s'
                          }}>
                            Acknowledge
                          </button>
                        )}
                        {selectedActionType === 'shadowban' && (
                          <button style={{
                            width: '100%',
                            padding: '12px 16px',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginTop: '16px',
                            transition: 'opacity 0.2s'
                          }}>
                            Learn More
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    color: '#dc2626',
                    fontSize: '13px',
                    marginBottom: '16px'
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={() => handleUserAction(selectedActionType)}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: selectedActionType === 'warn' ? '#f59e0b' : selectedActionType === 'ban' ? '#ef4444' : selectedActionType === 'delete' ? '#8b5cf6' : '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    Confirm Action
                  </button>
                  <button
                    onClick={() => {
                      setSelectedActionType(null);
                      setReasonModal({ isOpen: false, action: null, itemId: null, itemType: null, reason: '' });
                      setNotificationPreview(null);
                      setBanType('permanent');
                      setBanDuration({ value: 7, unit: 'days' });
                    }}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#e5e7eb',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
          {/* Promotions Tab */}
          {activeTab === 'promotions' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={() => setPromotionModal({ ...promotionModal, isOpen: true })}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #f59e0b 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '700',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = '0 8px 20px rgba(245,158,11,0.4)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = '0 4px 12px rgba(245,158,11,0.3)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  + Send New Promotion
                </button>
              </div>
              <div style={{ marginTop: '8px' }}>
                <button
                  onClick={() => { setActiveTab('ads'); setShowAdsOptions(true); }}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '700',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(59,130,246,0.25)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = '0 8px 20px rgba(59,130,246,0.35)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = '0 4px 12px rgba(59,130,246,0.25)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Serve Advertisements
                </button>
              </div>
              {/* Overlay Templates Section */}
              <div style={{ marginTop: '32px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0', color: '#111827' }}>News Ticker Templates</h2>
                </div>
                {templates.length === 0 ? (
                  <div style={{
                    padding: '48px 32px',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    borderRadius: '12px',
                    color: '#6b7280',
                    border: '1px solid #bae6fd'
                  }}>
                    <div style={{ 
                      width: '80px',
                      height: '80px',
                      backgroundColor: 'rgba(59,130,246,0.1)',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}>
                      <Megaphone size={40} style={{ color: '#3b82f6' }} />
                    </div>
                    <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>No Templates Yet</p>
                    <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>Save overlays from the ad preview to create reusable templates</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {templates.map(t => (
                      <div key={t.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '16px', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '10px',
                        background: '#ffffff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                          <div style={{ width: '12px', height: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '3px' }} />
                          <div>
                            <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>{t.name}</div>
                            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>News ticker overlay</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setTemplatePanelOpen(templatePanelOpen === t.id ? null : t.id)} 
                          style={{ 
                            padding: '8px 16px', 
                            borderRadius: '6px', 
                            border: '1px solid #d1d5db', 
                            background: templatePanelOpen === t.id ? '#3b82f6' : 'white',
                            color: templatePanelOpen === t.id ? 'white' : '#1f2937',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '13px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (templatePanelOpen !== t.id) {
                              e.target.style.background = '#f3f4f6';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (templatePanelOpen !== t.id) {
                              e.target.style.background = 'white';
                            }
                          }}
                        >
                          {templatePanelOpen === t.id ? 'Close' : 'Apply'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {templatePanelOpen && (
                  <div style={{ marginTop: '12px', padding: '12px', border: '1px dashed #d1d5db', borderRadius: '8px' }}>
                    <div style={{ marginBottom: '8px', fontWeight: '600' }}>Select videos to apply</div>
                    <div style={{ maxHeight: '160px', overflow: 'auto', border: '1px solid #f3f4f6', padding: '8px', borderRadius: '6px' }}>
                      {videos.map(v => (
                        <label key={v.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                          <input type="checkbox" checked={selectedVideosForApply.includes(v.id)} onChange={(e) => {
                            if (e.target.checked) setSelectedVideosForApply(prev => [...prev, v.id]);
                            else setSelectedVideosForApply(prev => prev.filter(id => id !== v.id));
                          }} />
                          <span style={{ fontSize: '13px' }}>{v.title || v.id}</span>
                        </label>
                      ))}
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <label style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><input type="radio" name="placement" value="beginning" checked={applyPlacement === 'beginning'} onChange={() => setApplyPlacement('beginning')} /> Beginning</label>
                      <label style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><input type="radio" name="placement" value="end" checked={applyPlacement === 'end'} onChange={() => setApplyPlacement('end')} /> End</label>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setTemplatePanelOpen(null); setSelectedVideosForApply([]); }} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white' }}>Cancel</button>
                        <button onClick={() => { applyTemplateToVideos(templatePanelOpen, selectedVideosForApply, applyPlacement); setTemplatePanelOpen(null); setSelectedVideosForApply([]); }} style={{ padding: '6px 10px', borderRadius: '6px', background: '#3b82f6', color: 'white', border: 'none' }}>Apply</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 20px 0', color: '#1f2937' }}>Overlay Templates</h2>
              {templates.length === 0 ? (
                <div style={{
                  padding: '48px 32px',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  borderRadius: '10px',
                  color: '#6b7280',
                  border: '1px solid #d1d5db'
                }}>
                  <div style={{ 
                    width: '72px',
                    height: '72px',
                    backgroundColor: 'rgba(59,130,246,0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <Copy size={36} style={{ color: '#3b82f6' }} />
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>No Templates Yet</p>
                  <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>Save overlays from the preview to create reusable templates</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {templates.map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                        <div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '3px' }} />
                        <div>
                          <div style={{ fontWeight: '600', color: '#1f2937' }}>{t.name}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{t.overlay?.assetType || 'overlay'}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button onClick={() => setTemplatePanelOpen(templatePanelOpen === t.id ? null : t.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>{templatePanelOpen === t.id ? 'Close' : 'Apply'}</button>
                        <button onClick={() => { setTemplates(prev => prev.filter(x => x.id !== t.id)); setTemplatePanelOpen(null); }} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fee2e2', color: '#dc2626', cursor: 'pointer' }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {templatePanelOpen && (
                <div style={{ marginTop: '20px', padding: '16px', border: '1px dashed #d1d5db', borderRadius: '8px', background: '#f9fafb' }}>
                  <div style={{ marginBottom: '12px', fontWeight: '600' }}>Apply to Videos</div>
                  <div style={{ maxHeight: '240px', overflow: 'auto', border: '1px solid #e5e7eb', padding: '8px', borderRadius: '6px', marginBottom: '12px' }}>
                    {videos.length === 0 ? (
                      <p style={{ color: '#6b7280', fontSize: '13px' }}>No videos available</p>
                    ) : (
                      videos.map(v => (
                        <label key={v.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedVideosForApply.includes(v.id)} onChange={(e) => {
                            if (e.target.checked) setSelectedVideosForApply(prev => [...prev, v.id]);
                            else setSelectedVideosForApply(prev => prev.filter(id => id !== v.id));
                          }} />
                          <span style={{ fontSize: '13px' }}>{v.title || v.id}</span>
                        </label>
                      ))
                    )}
                  </div>
                  <div style={{ marginBottom: '12px', fontWeight: '600' }}>Position</div>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                    <label style={{ display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer' }}><input type="radio" name="placement" value="beginning" checked={applyPlacement === 'beginning'} onChange={() => setApplyPlacement('beginning')} /> Beginning of video</label>
                    <label style={{ display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer' }}><input type="radio" name="placement" value="end" checked={applyPlacement === 'end'} onChange={() => setApplyPlacement('end')} /> End of video</label>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setTemplatePanelOpen(null); setSelectedVideosForApply([]); }} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => { applyTemplateToVideos(templatePanelOpen, selectedVideosForApply, applyPlacement); setTemplatePanelOpen(null); setSelectedVideosForApply([]); }} style={{ padding: '8px 12px', borderRadius: '6px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}>Apply Template</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div style={{ padding: '0 0 40px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                    <div>
                        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                             <Star style={{ color: '#d946ef' }} /> User & Creator Feedback
                        </h2>
                        <p style={{ color: '#6b7280', marginTop: 6 }}>Insights collected from creators after publishing and users after watching</p>
                    </div>
                </div>

                {(() => {
                    // Collect feedback items from localStorage
                    const items = [];
                    if (typeof window !== 'undefined') {
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key && key.startsWith('feedback_')) {
                                try {
                                    const val = JSON.parse(localStorage.getItem(key));
                                    const type = key.startsWith('feedback_creator_') ? 'Creator' : 'Requester';
                                    const id = key.replace('feedback_creator_', '').replace('feedback_requester_', '');
                                    items.push({ id, type, ...val });
                                } catch(e) {}
                            }
                        }
                    }

                    if (items.length === 0) {
                        return (
                            <div style={{ padding: 60, textAlign: 'center', background: '#f9fafb', borderRadius: 16 }}>
                                <div style={{ marginBottom: 16, display: 'inline-flex', padding: 16, background: '#e0e7ff', borderRadius: '50%' }}>
                                    <Megaphone size={32} color="#4f46e5" />
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#374151' }}>No Feedback Yet</h3>
                                <p style={{ color: '#6b7280' }}>Wait for creators to publish videos or requesters to rate them.</p>
                            </div>
                        );
                    }

                    return (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
                            {items.map((item, idx) => (
                                <div key={idx} style={{ 
                                    background: 'white', 
                                    borderRadius: 16, 
                                    padding: 24, 
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                                    border: '1px solid #f3f4f6',
                                    transition: 'transform 0.2s',
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    gap: 16
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ 
                                            padding: '4px 12px', 
                                            borderRadius: 20, 
                                            fontSize: 12, 
                                            fontWeight: 700,
                                            background: item.type === 'Creator' ? '#ede9fe' : '#dbeafe',
                                            color: item.type === 'Creator' ? '#7c3aed' : '#2563eb'
                                        }}>
                                            {item.type} Feedback
                                        </span>
                                        <span style={{ fontSize: 12, color: '#9ca3af' }}>ID: {item.id.substring(0,6)}...</span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {Object.keys(item).filter(k => k!=='id' && k!=='type').map(k => (
                                            <div key={k} style={{ fontSize: 13 }}>
                                                <div style={{ color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                                                    {k.replace(/_/g, ' ')}
                                                </div>
                                                <div style={{ color: '#111827', fontWeight: 500 }}>
                                                    {['1','2','3','4','5'].includes(String(item[k])) ? (
                                                        <div style={{ display: 'flex', gap: 2 }}>
                                                            {[1,2,3,4,5].map(n => (
                                                                <Star 
                                                                    key={n} 
                                                                    size={14} 
                                                                    fill={n <= Number(item[k]) ? '#fbbf24' : 'none'} 
                                                                    color={n <= Number(item[k]) ? '#fbbf24' : '#d1d5db'} 
                                                                />
                                                            ))}
                                                        </div>
                                                    ) : item[k]}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </div>
          )}

          {/* Support Tickets Tab */}
          {activeTab === 'support' && (
            <SupportTicketPanel selectedLanguage={selectedLanguage} />
          )}

          {/* Onboarding Tab */}
          {activeTab === 'onboarding' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0', color: '#1f2937' }}>Creator Onboarding Information</h2>
                <p style={{ color: '#6b7280', margin: '0', fontSize: '14px' }}>View all creators who have completed onboarding registration</p>
              </div>

              {onboardingList.length === 0 ? (
                <div style={{
                  padding: '48px 32px',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  borderRadius: '10px',
                  color: '#6b7280',
                  border: '1px solid #d1d5db'
                }}>
                  <div style={{ 
                    width: '72px',
                    height: '72px',
                    backgroundColor: 'rgba(79,70,229,0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <Users size={36} style={{ color: '#4f46e5' }} />
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
                    No Onboarding Data Yet
                  </p>
                  <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>
                    Creator onboarding information will appear here when creators complete registration
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                    Showing {onboardingList.length} onboarded creator(s)
                  </p>
                  {onboardingList.map((onboarding, idx) => (
                    <div key={idx} style={{
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Creator Name</label>
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                            {onboarding.creatorName || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Email</label>
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#374151' }}>
                            {onboarding.userEmail || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Bio</label>
                          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#374151' }}>
                            {onboarding.bio || 'No bio provided'}
                          </p>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Social Handle</label>
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#374151' }}>
                            @{onboarding.socialMediaHandle || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Social Followers</label>
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                            {onboarding.socialFollowers ? onboarding.socialFollowers.toLocaleString() : '0'}
                          </p>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Intro Video URL</label>
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#3b82f6', wordBreak: 'break-all' }}>
                            {onboarding.introVideoUrl ? (
                              <a href={onboarding.introVideoUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                                View Video
                              </a>
                            ) : 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Onboarded At</label>
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#374151' }}>
                            {onboarding.completedAt ? new Date(onboarding.completedAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Terms Agreed</label>
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', backgroundColor: onboarding.agreedTOS ? '#dcfce7' : '#fee2e2' }}>
                              {onboarding.agreedTOS ? '✓' : '✗'} <span style={{ fontSize: '12px' }}>TOS</span>
                            </span>
                            {' '}
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', backgroundColor: onboarding.agreedPrivacy ? '#dcfce7' : '#fee2e2' }}>
                              {onboarding.agreedPrivacy ? '✓' : '✗'} <span style={{ fontSize: '12px' }}>Privacy</span>
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ads Tab */}
          {activeTab === 'ads' && (
            <div>
              {showAdsOptions && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                  <div style={{ width: '100%', maxWidth: 500, padding: 32, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', background: 'white' }}>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: 24, fontWeight: 700, color: '#111827' }}>Create Advertisement</h2>
                    <p style={{ color: '#6b7280', margin: '0 0 24px 0', fontSize: 14 }}>Choose an ad format to configure and deploy across videos</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <button 
                        onClick={() => { setAdsMode('video'); setShowAdsOptions(false); }} 
                        style={{ 
                          padding: '14px 16px', 
                          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: 10, 
                          cursor: 'pointer', 
                          fontWeight: 700,
                          fontSize: 14,
                          transition: 'all 0.2s',
                          textAlign: 'left',
                          boxShadow: '0 2px 8px rgba(15,23,42,0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 4px 16px rgba(15,23,42,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(15,23,42,0.2)';
                        }}
                      >
                        <div style={{ fontSize: 15, fontWeight: 700 }}>Video Ads</div>
                        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Interactive CTA overlays on video player</div>
                      </button>
                      <button 
                        onClick={() => { setAdsMode('overlay'); setShowAdsOptions(false); }} 
                        style={{ 
                          padding: '14px 16px', 
                          background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: 10, 
                          cursor: 'pointer', 
                          fontWeight: 700,
                          fontSize: 14,
                          transition: 'all 0.2s',
                          textAlign: 'left',
                          boxShadow: '0 2px 8px rgba(6,182,212,0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 4px 16px rgba(6,182,212,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(6,182,212,0.2)';
                        }}
                      >
                        <div style={{ fontSize: 15, fontWeight: 700 }}>News Ticker</div>
                        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Animated scrolling text overlay at bottom</div>
                      </button>
                      <button 
                        onClick={() => { setAdsMode('bottom'); setShowAdsOptions(false); }} 
                        style={{ 
                          padding: '14px 16px', 
                          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: 10, 
                          cursor: 'pointer', 
                          fontWeight: 700,
                          fontSize: 14,
                          transition: 'all 0.2s',
                          textAlign: 'left',
                          boxShadow: '0 2px 8px rgba(16,185,129,0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 4px 16px rgba(16,185,129,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(16,185,129,0.2)';
                        }}
                      >
                        <div style={{ fontSize: 15, fontWeight: 700 }}>Branded Card</div>
                        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Profile card with text and clickable link</div>
                      </button>
                      <button 
                        onClick={() => { setAdsMode('default2'); setShowAdsOptions(false); }} 
                        style={{ 
                          padding: '14px 16px', 
                          background: 'linear-gradient(135deg, #c026d3 0%, #d946ef 100%)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: 10, 
                          cursor: 'pointer', 
                          fontWeight: 700,
                          fontSize: 14,
                          transition: 'all 0.2s',
                          textAlign: 'left',
                          boxShadow: '0 2px 8px rgba(217,70,239,0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 4px 16px rgba(217,70,239,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(217,70,239,0.2)';
                        }}
                      >
                        <div style={{ fontSize: 15, fontWeight: 700 }}>Inline Banner</div>
                        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Customizable banner with title and description</div>
                      </button>
                      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        <button 
                          onClick={() => setShowAdsOptions(false)} 
                          style={{ 
                            flex: 1,
                            padding: '10px 12px', 
                            background: 'transparent', 
                            color: '#6b7280', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: 8, 
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 13,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#f9fafb';
                            e.target.style.borderColor = '#d1d5db';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.borderColor = '#e5e7eb';
                          }}
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => { setShowTemplatesModal(true); }} 
                          style={{ 
                            flex: 1,
                            padding: '10px 12px', 
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: 8, 
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 13,
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(37,99,235,0.2)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(37,99,235,0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 8px rgba(37,99,235,0.2)';
                          }}
                        >
                          Saved Templates
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0', color: '#1f2937', letterSpacing: '-0.5px' }}>Ad Management</h2>
              </div>

              {/* Ad Assets Section */}
              {/* Ads Mode: Video ad configuration */}
              {adsMode === 'video' && (
                <div style={{ marginBottom: '20px', padding: '16px', borderRadius: 10, border: '1px solid #e6edf3', background: '#fff' }}>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Configure Video Ad</h4>
                  
                  {/* Input Fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    {/* Ad Title */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>AD TITLE</label>
                      <input placeholder="Your video ad title" value={videoAdTitle} onChange={(e) => setVideoAdTitle(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                    </div>

                    {/* CTA Button Text */}
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>CTA BUTTON TEXT</label>
                      <input placeholder="e.g., Learn More" value={videoAdCtaText} onChange={(e) => setVideoAdCtaText(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                    </div>

                    {/* CTA Button Color */}
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>CTA BUTTON COLOR</label>
                      <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input type="color" value={videoAdCtaColor} onChange={(e) => setVideoAdCtaColor(e.target.value)} style={{ width: 50, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                          <input type="text" value={videoAdCtaColor} onChange={(e) => setVideoAdCtaColor(e.target.value)} placeholder="#4B9EFF" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'monospace', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'].map(color => (
                            <button key={color} onClick={() => setVideoAdCtaColor(color)} style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: color, border: videoAdCtaColor === color ? '3px solid #1f2937' : '2px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title={color} />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Target Link */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>TARGET LINK</label>
                      <input placeholder="https://example.com" value={videoAdLink} onChange={(e) => setVideoAdLink(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => { setAdsMode(null); }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>Close</button>
                    <button onClick={() => setShowVideoAdPreview(true)} style={{ padding: '8px 12px', borderRadius: 8, background: '#111827', color: 'white', border: 'none', cursor: 'pointer' }}>Preview</button>
                    <button onClick={() => setToast({ type: 'success', title: 'Saved', message: 'Video ad template saved!' })} style={{ padding: '8px 12px', borderRadius: 8, background: '#0b74de', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save Template</button>
                    <button onClick={() => setToast({ type: 'info', title: 'Apply', message: 'Apply video ad to videos' })} style={{ padding: '8px 12px', borderRadius: 8, background: '#0b74de', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Apply</button>
                  </div>
                </div>
              )}

              {/* Ad Assets Section */}
              {/* Ads Mode: Bottom ad configuration */}
              {adsMode === 'bottom' && (
                <div style={{ marginBottom: '20px', padding: '16px', borderRadius: 10, border: '1px solid #e6edf3', background: '#fff' }}>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Configure Bottom Video Ad</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                    <div>
                      <label style={{ fontSize: 13, color: '#374151' }}>Profile Name</label>
                      <input value={bottomAdProfileName} onChange={(e) => setBottomAdProfileName(e.target.value)} placeholder="Advertiser name" style={{ width: '100%', padding: '8px', marginTop: 6, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: '#374151' }}>Profile Avatar URL</label>
                      <input value={bottomAdProfileAvatar} onChange={(e) => setBottomAdProfileAvatar(e.target.value)} placeholder="https://...jpg" style={{ width: '100%', padding: '8px', marginTop: 6, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: 13, color: '#374151', marginBottom: 8, display: 'block' }}>Ad Text Items (displayed at interval)</label>
                      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fafbfc', maxHeight: '200px', overflowY: 'auto' }}>
                        {bottomAdTextItems.length === 0 ? (
                          <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '20px 12px' }}>No text items yet. Add one below to get started.</p>
                        ) : (
                          bottomAdTextItems.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: idx === bottomAdTextItems.length - 1 ? 0 : 8 }}>
                              <input 
                                value={item} 
                                onChange={(e) => {
                                  const updated = [...bottomAdTextItems];
                                  updated[idx] = e.target.value;
                                  setBottomAdTextItems(updated);
                                }} 
                                placeholder={`Text item ${idx + 1}`}
                                style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', fontSize: 13 }}
                              />
                              <button 
                                onClick={() => {
                                  setBottomAdTextItems(bottomAdTextItems.filter((_, i) => i !== idx));
                                }} 
                                style={{ padding: '6px 8px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                                Remove
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                      <button 
                        onClick={() => setBottomAdTextItems([...bottomAdTextItems, ''])}
                        style={{ marginTop: 8, padding: '8px 12px', background: '#dbeafe', color: '#0369a1', border: '1px solid #7dd3fc', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        + Add Text Item
                      </button>
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: '#374151' }}>Text Rotation Interval (ms)</label>
                      <input 
                        type="number" 
                        value={bottomAdTextInterval} 
                        onChange={(e) => setBottomAdTextInterval(Math.max(1000, parseInt(e.target.value) || 5000))} 
                        min={1000}
                        step={500}
                        style={{ width: '100%', padding: '8px', marginTop: 6, borderRadius: 8, border: '1px solid #e5e7eb' }}
                      />
                      <small style={{ fontSize: 11, color: '#6b7280', marginTop: 4, display: 'block' }}>Min 1000ms (1 second)</small>
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: '#374151' }}>Text Transition</label>
                      <BeautifulDropdown
                        value={bottomAdTextAnimation}
                        onChange={setBottomAdTextAnimation}
                        options={[
                          { value: 'fade', label: 'Fade', icon: '✨', description: 'Smooth opacity transition' },
                          { value: 'slide-left', label: 'Slide Left', icon: '→', description: 'Text moves from right to left' },
                          { value: 'slide-right', label: 'Slide Right', icon: '←', description: 'Text moves from left to right' },
                          { value: 'bounce', label: 'Bounce', icon: '🎾', description: 'Spring-like bounce effect' },
                          { value: 'scale', label: 'Scale', icon: '📏', description: 'Size grows and shrinks' }
                        ]}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: '#374151' }}>Card Entry Animation</label>
                      <BeautifulDropdown
                        value={bottomAdCardAnimation}
                        onChange={setBottomAdCardAnimation}
                        options={[
                          { value: 'fade', label: 'Fade', icon: '✨', description: 'Simple opacity fade-in' },
                          { value: 'line-first', label: 'Line First', icon: '━', description: 'Purple line appears first' },
                          { value: 'slide-down', label: 'Slide Down', icon: '⬇️', description: 'Comes from top of screen' },
                          { value: 'bounce-in', label: 'Bounce In', icon: '⏹️', description: 'Bouncy entrance animation' },
                          { value: 'scale-up', label: 'Scale Up', icon: '📏', description: 'Grows from center' }
                        ]}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: '#374151' }}>Card Effect (After Entry)</label>
                      <BeautifulDropdown
                        value={bottomAdCardEffect}
                        onChange={setBottomAdCardEffect}
                        options={[
                          { value: 'none', label: 'None', icon: '⭕', description: 'No additional effect' },
                          { value: 'pulse', label: 'Pulse', icon: '💓', description: 'Subtle breathing effect' },
                          { value: 'shake', label: 'Shake', icon: '📳', description: 'Slight horizontal shaking' },
                          { value: 'glow', label: 'Glow', icon: '⚡', description: 'Purple glowing aura' },
                          { value: 'float', label: 'Float', icon: '🎈', description: 'Gentle up and down motion' },
                          { value: 'rotate', label: 'Rotate', icon: '🔄', description: 'Subtle rotating effect' }
                        ]}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: '#374151' }}>Exit Animation</label>
                      <BeautifulDropdown
                        value={bottomAdCardExitAnimation}
                        onChange={setBottomAdCardExitAnimation}
                        options={[
                          { value: 'fadeOut', label: 'Fade Out', icon: '✨', description: 'Smooth fade to transparent' },
                          { value: 'slideOut', label: 'Slide Out', icon: '→', description: 'Slide to the right' },
                          { value: 'scaleDown', label: 'Scale Down', icon: '📏', description: 'Shrinks and disappears' },
                          { value: 'bounceOut', label: 'Bounce Out', icon: '🎾', description: 'Bounces away' },
                          { value: 'rotateOut', label: 'Rotate Out', icon: '🔄', description: 'Rotates while fading' }
                        ]}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: '#374151' }}>Border Color</label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="color"
                          value={bottomAdBorderColor.includes('#') ? bottomAdBorderColor : '#FF00FF'}
                          onChange={(e) => setBottomAdBorderColor(e.target.value)}
                          style={{ width: 50, height: 40, borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 12, color: '#6b7280' }}>Pick a color for the card border</span>
                      </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: 13, color: '#374151' }}>Target Link</label>
                      <input value={bottomAdLink} onChange={(e) => setBottomAdLink(e.target.value)} placeholder="https://example.com" style={{ width: '100%', padding: '8px', marginTop: 6, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16, flexWrap: 'wrap' }}>
                    <button onClick={() => { setAdsMode(null); }} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>Close</button>
                    <button onClick={(e) => { e.preventDefault(); saveBottomAdTemplate(); }} style={{ padding: '9px 16px', borderRadius: 8, background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>Save Template</button>
                    <button onClick={() => setShowTemplatesModal(true)} style={{ padding: '9px 16px', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Templates ({bottomAdTemplates.length})</button>
                    <button onClick={() => {
                      if (!bottomAdProfileName || bottomAdTextItems.length === 0) { setToast({ type: 'error', title: 'Missing fields', message: 'Please provide profile name and at least one text item.' }); return; }
                      setShowBottomPreview(true);
                    }} style={{ padding: '9px 16px', borderRadius: 8, background: '#111827', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>Preview</button>
                    <button onClick={() => {
                      if (!bottomAdProfileName || bottomAdTextItems.length === 0) { setToast({ type: 'error', title: 'Missing fields', message: 'Please provide profile name and at least one text item.' }); return; }
                      setShowBottomApplyModal(true);
                    }} style={{ padding: '9px 16px', borderRadius: 8, background: '#0b74de', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Apply</button>
                  </div>
                </div>
              )}

              {/* Ads Mode: Default 2 configuration (card containers with purple separator) */}
              {adsMode === 'default2' && (
                <div style={{ marginBottom: '20px', padding: '16px', borderRadius: 10, border: '1px solid #e6edf3', background: '#fff' }}>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Configure Default 2 Ad</h4>
                  
                  {/* Input Fields Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    {/* Line Color */}
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>LINE COLOR</label>
                      <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input type="color" value={default2LineColor} onChange={(e) => setDefault2LineColor(e.target.value)} style={{ width: 50, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                          <input type="text" value={default2LineColor} onChange={(e) => setDefault2LineColor(e.target.value)} placeholder="#8b5cf6" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'monospace', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {['#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1'].map(color => (
                            <button key={color} onClick={() => setDefault2LineColor(color)} style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: color, border: default2LineColor === color ? '3px solid #1f2937' : '2px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title={color} />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Background Color */}
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>BACKGROUND COLOR</label>
                      <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input type="color" value={default2BgColor} onChange={(e) => setDefault2BgColor(e.target.value)} style={{ width: 50, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                          <input type="text" value={default2BgColor} onChange={(e) => setDefault2BgColor(e.target.value)} placeholder="#ffffff" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'monospace', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#111827', '#1f2937'].map(color => (
                            <button key={color} onClick={() => setDefault2BgColor(color)} style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: color, border: default2BgColor === color ? '3px solid #1f2937' : '2px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title={color} />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Text Color */}
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>TEXT COLOR</label>
                      <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input type="color" value={default2TextColor} onChange={(e) => setDefault2TextColor(e.target.value)} style={{ width: 50, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                          <input type="text" value={default2TextColor} onChange={(e) => setDefault2TextColor(e.target.value)} placeholder="#1f2937" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'monospace', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {['#000000', '#1f2937', '#374151', '#4b5563', '#ffffff', '#f3f4f6'].map(color => (
                            <button key={color} onClick={() => setDefault2TextColor(color)} style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: color, border: default2TextColor === color ? '3px solid #1f2937' : '2px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title={color} />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>TITLE</label>
                      <input placeholder="Card title" value={default2Title} onChange={(e) => setDefault2Title(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                    </div>

                    {/* Description */}
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>DESCRIPTION</label>
                      <input placeholder="Card description" value={default2Description} onChange={(e) => setDefault2Description(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                    </div>

                    {/* Logo/Image URL */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>LOGO/IMAGE URL</label>
                      <input placeholder="https://example.com/logo.png" value={default2Logo} onChange={(e) => setDefault2Logo(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                    </div>

                    {/* Profile Link */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>PROFILE LINK</label>
                      <input placeholder="https://example.com" value={default2Link} onChange={(e) => setDefault2Link(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16, flexWrap: 'wrap' }}>
                    <button onClick={() => { setAdsMode(null); }} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>Close</button>
                    <button onClick={() => setShowDefault2Preview(true)} style={{ padding: '9px 16px', borderRadius: 8, background: '#111827', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>Preview</button>
                    <button onClick={() => setShowDefault2SaveModal(true)} style={{ padding: '9px 16px', borderRadius: 8, background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>Save Template</button>
                    <button onClick={() => setShowDefault2TemplatesModal(true)} style={{ padding: '9px 16px', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Templates ({default2Templates.length})</button>
                    <button onClick={() => setShowDefault2ApplyModal(true)} style={{ padding: '9px 16px', borderRadius: 8, background: '#d946ef', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Apply to Videos</button>
                  </div>
                </div>
              )}

              {/* Video Ad Preview Modal */}
              {showVideoAdPreview && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 20 }} onClick={() => setShowVideoAdPreview(false)}>
                  <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: '#000', borderRadius: 12, position: 'relative', display: 'flex', flexDirection: 'column', aspectRatio: 9/16, overflow: 'hidden' }}>
                    
                    {/* Close button */}
                    <button onClick={() => setShowVideoAdPreview(false)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 100, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>✕</button>

                    {/* Video Playing Area - showing background video */}
                    <div style={{ flex: 1, background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 14, position: 'relative', overflow: 'hidden' }}>
                      {/* Video placeholder/background */}
                      <div style={{ position: 'absolute', inset: 0, background: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27400%27 height=%27600%27%3E%3Crect fill=%27%23111827%27 width=%27400%27 height=%27600%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 font-size=%2740%27 fill=%27%236b7280%27 text-anchor=%27middle%27 dominant-baseline=%27middle%27%3EVideo Playing%3C/text%3E%3C/svg%3E")', backgroundSize: 'cover', opacity: 0.8 }} />
                      
                      {/* Video Ad Overlay - your ad video/content plays on top */}
                      <div style={{ 
                        position: 'absolute', 
                        inset: '40px 20px', 
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', 
                        borderRadius: 12, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        padding: '20px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        zIndex: 10,
                        border: '2px solid rgba(255,255,255,0.1)'
                      }}>
                        <div style={{ width: '100%', height: '120px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#90caf9', fontWeight: 600, fontSize: 14 }}>
                          🎬 Ad Video
                        </div>
                        <div style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>{videoAdTitle || 'Your Ad Title'}</div>
                        
                        {/* CTA Button */}
                        <button style={{
                          padding: '12px 24px',
                          background: videoAdCtaColor || '#0b74de',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                        }}>
                          {videoAdCtaText || 'Learn More'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Default 2 Preview Modal */}
              {showDefault2Preview && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 20 }} onClick={() => setShowDefault2Preview(false)}>
                  <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', background: '#000', borderRadius: 12, position: 'relative', display: 'flex', flexDirection: 'column', aspectRatio: 9/16 }}>
                    
                    {/* Close button */}
                    <button onClick={() => setShowDefault2Preview(false)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 100, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>✕</button>

                    {/* Video background placeholder */}
                    <div style={{ flex: 1, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 14, position: 'relative' }}>
                      Video Content Area
                      
                      {/* Corner Button Preview */}
                      <button style={{
                        position: 'absolute',
                        bottom: 20,
                        right: 16,
                        padding: '10px 16px',
                        background: 'linear-gradient(135deg, #ff0080 0%, #ff8c00 100%)',
                        color: '#ffffff',
                        border: '2px solid #ff0080',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(255, 0, 128, 0.4)',
                        whiteSpace: 'nowrap',
                        zIndex: 10
                      }}>
                        Visit Link
                      </button>
                    </div>

                    {/* Cards Container */}
                    <div style={{ background: '#000', padding: '16px', borderTop: `3px solid ${default2LineColor || '#d946ef'}` }}>
                      {[1, 2].map((i) => (
                        <div key={i} style={{
                          marginBottom: i === 1 ? 12 : 0,
                          padding: '12px 14px',
                          background: default2BgColor || '#ffffff',
                          border: `2px solid ${(default2BgColor || '#ffffff')}`,
                          borderLeft: `3px solid ${default2LineColor || '#d946ef'}`,
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          minHeight: '70px'
                        }}>
                          {/* Logo */}
                          {default2Logo && (
                            <img src={default2Logo} alt="logo" style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={(e) => e.target.style.display = 'none'} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: default2TextColor || '#111827', marginBottom: 4 }}>{default2Title || 'Card Title'}</div>
                            <div style={{ fontSize: 12, color: default2TextColor || '#6b7280' }}>{default2Description || 'Card description'}</div>
                          </div>
                          <div style={{ fontSize: 20, color: default2LineColor || '#d946ef', flexShrink: 0 }}>→</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Ads Mode: Overlay ad configuration (news ticker style) */}
              {adsMode === 'overlay' && (
                <div style={{ marginBottom: '20px', padding: '16px', borderRadius: 12, border: '1px solid #e6edf3', background: '#fff', maxWidth: '100%', overflowX: 'hidden' }}>
                  <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Configure Overlay Ad (News Ticker)</h4>
                  
                  {/* Company Name as Badge Button */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 8 }}>COMPANY NAME</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={overlayAdCompanyName} onChange={(e) => setOverlayAdCompanyName(e.target.value)} placeholder="Enter company..." style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, minWidth: 0 }} />
                      <div style={{ padding: '8px 12px', borderRadius: 8, background: overlayAdBgColor, color: overlayAdTextColor, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                        {overlayAdCompanyName || 'Preview'}
                      </div>
                    </div>
                  </div>

                  {/* Colors and Position - 2 column */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>BACKGROUND COLOR</label>
                      <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input type="color" value={overlayAdBgColor} onChange={(e) => setOverlayAdBgColor(e.target.value)} style={{ width: 50, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                          <input type="text" value={overlayAdBgColor} onChange={(e) => setOverlayAdBgColor(e.target.value)} placeholder="#E41E24" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'monospace', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {['#E41E24', '#DC143C', '#FF6B6B', '#FF4757', '#FE5454'].map(color => (
                            <button key={color} onClick={() => setOverlayAdBgColor(color)} style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: color, border: overlayAdBgColor === color ? '3px solid #1f2937' : '2px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title={color} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>TEXT COLOR</label>
                      <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input type="color" value={overlayAdTextColor} onChange={(e) => setOverlayAdTextColor(e.target.value)} style={{ width: 50, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                          <input type="text" value={overlayAdTextColor} onChange={(e) => setOverlayAdTextColor(e.target.value)} placeholder="#fff" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'monospace', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {['#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db', '#000000'].map(color => (
                            <button key={color} onClick={() => setOverlayAdTextColor(color)} style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: color, border: overlayAdTextColor === color ? '3px solid #1f2937' : '2px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title={color} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Brand Button Colors */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>BRAND BACKGROUND</label>
                      <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input type="color" value={overlayBrandBgColor} onChange={(e) => setOverlayBrandBgColor(e.target.value)} style={{ width: 50, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                          <input type="text" value={overlayBrandBgColor} onChange={(e) => setOverlayBrandBgColor(e.target.value)} placeholder="#ffffff" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'monospace', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#0b74de'].map(color => (
                            <button key={color} onClick={() => setOverlayBrandBgColor(color)} style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: color, border: overlayBrandBgColor === color ? '3px solid #1f2937' : '2px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title={color} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>BRAND TEXT</label>
                      <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input type="color" value={overlayBrandTextColor} onChange={(e) => setOverlayBrandTextColor(e.target.value)} style={{ width: 50, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                          <input type="text" value={overlayBrandTextColor} onChange={(e) => setOverlayBrandTextColor(e.target.value)} placeholder="#000000" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'monospace', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {['#000000', '#1f2937', '#374151', '#4b5563', '#ffffff'].map(color => (
                            <button key={color} onClick={() => setOverlayBrandTextColor(color)} style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: color, border: overlayBrandTextColor === color ? '3px solid #1f2937' : '2px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title={color} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Opacity Sliders for Banner and Tag */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>BANNER OPACITY</label>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input type="range" min={0} max={100} value={Math.round((overlayAdOpacity || 1) * 100)} onChange={(e) => setOverlayAdOpacity(Number(e.target.value) / 100)} style={{ flex: 1 }} />
                        <div style={{ minWidth: 40, textAlign: 'right', fontSize: 12, color: '#374151', fontWeight: 700 }}>{Math.round((overlayAdOpacity || 1) * 100)}%</div>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>TAG OPACITY</label>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input type="range" min={0} max={100} value={Math.round((overlayTagOpacity || 1) * 100)} onChange={(e) => setOverlayTagOpacity(Number(e.target.value) / 100)} style={{ flex: 1 }} />
                        <div style={{ minWidth: 40, textAlign: 'right', fontSize: 12, color: '#374151', fontWeight: 700 }}>{Math.round((overlayTagOpacity || 1) * 100)}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Position Dropdown */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>POSITION</label>
                      <div tabIndex={0} onBlur={() => setOverlayPositionOpen(false)} style={{ position: 'relative' }}>
                        <button onClick={() => setOverlayPositionOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, border: '2px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s ease', borderColor: overlayPositionOpen ? '#0b74de' : '#e5e7eb', backgroundColor: overlayPositionOpen ? '#f0f9ff' : 'white' }}>
                          <span>{overlayAdPosition === 'bottom' ? '📍 Bottom Ticker' : overlayAdPosition === 'top' ? '📍 Top Ticker' : overlayAdPosition === 'fullscreen' ? '📺 Full Screen Banner' : overlayAdPosition === 'videoOverlay' ? '🎯 Video Overlay' : '🎬 Video Player Overlay'}</span>
                          <ChevronDown size={16} style={{ transition: 'transform 0.2s ease', transform: overlayPositionOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                        </button>
                        {overlayPositionOpen && (
                          <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 8px)', background: 'white', borderRadius: 8, boxShadow: '0 12px 32px rgba(0,0,0,0.15)', border: '1px solid #0b74de', zIndex: 1000, overflow: 'hidden', maxHeight: '280px', overflowY: 'auto' }}>
                            <div onMouseDown={(e) => { e.preventDefault(); setOverlayAdPosition('bottom'); setOverlayPositionOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayAdPosition === 'bottom' ? '#dbeafe' : 'transparent', color: overlayAdPosition === 'bottom' ? '#0b74de' : '#1f2937', borderLeft: overlayAdPosition === 'bottom' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayAdPosition === 'bottom' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayAdPosition === 'bottom' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayAdPosition === 'bottom' ? '#dbeafe' : 'transparent'; }}>📍 Bottom Ticker</div>
                            <div onMouseDown={(e) => { e.preventDefault(); setOverlayAdPosition('top'); setOverlayPositionOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayAdPosition === 'top' ? '#dbeafe' : 'transparent', color: overlayAdPosition === 'top' ? '#0b74de' : '#1f2937', borderLeft: overlayAdPosition === 'top' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayAdPosition === 'top' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayAdPosition === 'top' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayAdPosition === 'top' ? '#dbeafe' : 'transparent'; }}>📍 Top Ticker</div>
                            <div onMouseDown={(e) => { e.preventDefault(); setOverlayAdPosition('fullscreen'); setOverlayPositionOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayAdPosition === 'fullscreen' ? '#dbeafe' : 'transparent', color: overlayAdPosition === 'fullscreen' ? '#0b74de' : '#1f2937', borderLeft: overlayAdPosition === 'fullscreen' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayAdPosition === 'fullscreen' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayAdPosition === 'fullscreen' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayAdPosition === 'fullscreen' ? '#dbeafe' : 'transparent'; }}>📺 Full Screen Banner</div>
                            <div onMouseDown={(e) => { e.preventDefault(); setOverlayAdPosition('videoOverlay'); setOverlayPositionOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayAdPosition === 'videoOverlay' ? '#dbeafe' : 'transparent', color: overlayAdPosition === 'videoOverlay' ? '#0b74de' : '#1f2937', borderLeft: overlayAdPosition === 'videoOverlay' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayAdPosition === 'videoOverlay' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayAdPosition === 'videoOverlay' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayAdPosition === 'videoOverlay' ? '#dbeafe' : 'transparent'; }}>🎯 Video Overlay</div>
                            <div onMouseDown={(e) => { e.preventDefault(); setOverlayAdPosition('videoPlayer'); setOverlayPositionOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayAdPosition === 'videoPlayer' ? '#dbeafe' : 'transparent', color: overlayAdPosition === 'videoPlayer' ? '#0b74de' : '#1f2937', borderLeft: overlayAdPosition === 'videoPlayer' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayAdPosition === 'videoPlayer' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayAdPosition === 'videoPlayer' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayAdPosition === 'videoPlayer' ? '#dbeafe' : 'transparent'; }}>🎬 Video Player Overlay</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Animation Selector Dropdown */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>TEXT ANIMATION</label>
                      <select 
                        value={overlayTextAnimation} 
                        onChange={(e) => setOverlayTextAnimation(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.2s ease', borderColor: '#e5e7eb', backgroundColor: 'white' }}
                      >
                        <option value="marquee">🎬 Marquee (Left to Right)</option>
                        <option value="fade">✨ Fade In/Out</option>
                        <option value="slide">➡️ Slide In/Out</option>
                      </select>
                    </div>

                    {/* Emoji Selector Dropdown */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>TICKER EMOJI</label>
                      <div tabIndex={0} onBlur={() => setOverlayEmojiOpen(false)} style={{ position: 'relative' }}>
                        <button onClick={() => setOverlayEmojiOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, border: '2px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 14, transition: 'all 0.2s ease', borderColor: overlayEmojiOpen ? '#0b74de' : '#e5e7eb', backgroundColor: overlayEmojiOpen ? '#f0f9ff' : 'white' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{overlayAdEmoji} <span style={{ color: '#6b7280', fontSize: 12 }}>{overlayAdEmoji === '⚡' ? 'Lightning' : overlayAdEmoji === '🔴' ? 'Red Circle' : overlayAdEmoji === '📢' ? 'Megaphone' : overlayAdEmoji === '🚨' ? 'Alarm' : overlayAdEmoji === '💥' ? 'Explosion' : overlayAdEmoji === '⭐' ? 'Star' : overlayAdEmoji === '🎯' ? 'Target' : overlayAdEmoji === '📰' ? 'Newspaper' : overlayAdEmoji === '📺' ? 'TV' : 'Fire'}</span></span>
                          <ChevronDown size={16} style={{ transition: 'transform 0.2s ease', transform: overlayEmojiOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                        </button>
                        {overlayEmojiOpen && (
                          <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 8px)', background: 'white', borderRadius: 8, boxShadow: '0 12px 32px rgba(0,0,0,0.15)', border: '1px solid #0b74de', zIndex: 1000, overflow: 'hidden', maxHeight: '320px', overflowY: 'auto' }}>
                            <div onMouseDown={(e) => { e.preventDefault(); setOverlayAdEmoji('⚡'); setOverlayEmojiOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayAdEmoji === '⚡' ? '#dbeafe' : 'transparent', color: overlayAdEmoji === '⚡' ? '#0b74de' : '#1f2937', borderLeft: overlayAdEmoji === '⚡' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayAdEmoji === '⚡' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayAdEmoji === '⚡' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayAdEmoji === '⚡' ? '#dbeafe' : 'transparent'; }}>⚡ Lightning</div>
                            <div onMouseDown={(e) => { e.preventDefault(); setOverlayAdEmoji('🔴'); setOverlayEmojiOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayAdEmoji === '🔴' ? '#dbeafe' : 'transparent', color: overlayAdEmoji === '🔴' ? '#0b74de' : '#1f2937', borderLeft: overlayAdEmoji === '🔴' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayAdEmoji === '🔴' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayAdEmoji === '🔴' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayAdEmoji === '🔴' ? '#dbeafe' : 'transparent'; }}>🔴 Red Circle</div>
                            <div onMouseDown={(e) => { e.preventDefault(); setOverlayAdEmoji('📢'); setOverlayEmojiOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayAdEmoji === '📢' ? '#dbeafe' : 'transparent', color: overlayAdEmoji === '📢' ? '#0b74de' : '#1f2937', borderLeft: overlayAdEmoji === '📢' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayAdEmoji === '📢' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayAdEmoji === '📢' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayAdEmoji === '📢' ? '#dbeafe' : 'transparent'; }}>📢 Megaphone</div>
                            <div onMouseDown={(e) => { e.preventDefault(); setOverlayAdEmoji('🚨'); setOverlayEmojiOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayAdEmoji === '🚨' ? '#dbeafe' : 'transparent', color: overlayAdEmoji === '🚨' ? '#0b74de' : '#1f2937', borderLeft: overlayAdEmoji === '🚨' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayAdEmoji === '🚨' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayAdEmoji === '🚨' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayAdEmoji === '🚨' ? '#dbeafe' : 'transparent'; }}>🚨 Alarm</div>
                            <div onMouseDown={(e) => { e.preventDefault(); setOverlayAdEmoji('💥'); setOverlayEmojiOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayAdEmoji === '💥' ? '#dbeafe' : 'transparent', color: overlayAdEmoji === '💥' ? '#0b74de' : '#1f2937', borderLeft: overlayAdEmoji === '💥' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayAdEmoji === '💥' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayAdEmoji === '💥' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayAdEmoji === '💥' ? '#dbeafe' : 'transparent'; }}>💥 Explosion</div>
                            <div onMouseDown={(e) => { e.preventDefault(); setOverlayAdEmoji('⭐'); setOverlayEmojiOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayAdEmoji === '⭐' ? '#dbeafe' : 'transparent', color: overlayAdEmoji === '⭐' ? '#0b74de' : '#1f2937', borderLeft: overlayAdEmoji === '⭐' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayAdEmoji === '⭐' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayAdEmoji === '⭐' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayAdEmoji === '⭐' ? '#dbeafe' : 'transparent'; }}>⭐ Star</div>
                            <div onMouseDown={(e) => { e.preventDefault(); setOverlayAdEmoji('🎯'); setOverlayEmojiOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayAdEmoji === '🎯' ? '#dbeafe' : 'transparent', color: overlayAdEmoji === '🎯' ? '#0b74de' : '#1f2937', borderLeft: overlayAdEmoji === '🎯' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayAdEmoji === '🎯' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayAdEmoji === '🎯' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayAdEmoji === '🎯' ? '#dbeafe' : 'transparent'; }}>🎯 Target</div>
                            <div onMouseDown={(e) => { e.preventDefault(); setOverlayAdEmoji('📰'); setOverlayEmojiOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayAdEmoji === '📰' ? '#dbeafe' : 'transparent', color: overlayAdEmoji === '📰' ? '#0b74de' : '#1f2937', borderLeft: overlayAdEmoji === '📰' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayAdEmoji === '📰' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayAdEmoji === '📰' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayAdEmoji === '📰' ? '#dbeafe' : 'transparent'; }}>📰 Newspaper</div>
                            <div onMouseDown={(e) => { e.preventDefault(); setOverlayAdEmoji('📺'); setOverlayEmojiOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayAdEmoji === '📺' ? '#dbeafe' : 'transparent', color: overlayAdEmoji === '📺' ? '#0b74de' : '#1f2937', borderLeft: overlayAdEmoji === '📺' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayAdEmoji === '📺' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayAdEmoji === '📺' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayAdEmoji === '📺' ? '#dbeafe' : 'transparent'; }}>📺 TV</div>
                            <div onMouseDown={(e) => { e.preventDefault(); setOverlayAdEmoji('🔥'); setOverlayEmojiOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayAdEmoji === '🔥' ? '#dbeafe' : 'transparent', color: overlayAdEmoji === '🔥' ? '#0b74de' : '#1f2937', borderLeft: overlayAdEmoji === '🔥' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayAdEmoji === '🔥' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayAdEmoji === '🔥' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayAdEmoji === '🔥' ? '#dbeafe' : 'transparent'; }}>🔥 Fire</div>
                          </div>
                        )}
                      </div>
                    </div>

                  {/* Button Text - Only show for fullscreen */}
                  {overlayAdPosition === 'fullscreen' && (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>BUTTON TEXT</label>
                        <input value={overlayBtnText} onChange={(e) => setOverlayBtnText(e.target.value)} placeholder="e.g., Learn More" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>COMPANY PROFILE URL</label>
                        <input value={overlayProfileUrl} onChange={(e) => setOverlayProfileUrl(e.target.value)} placeholder="e.g., https://example.com/profile.jpg" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                      </div>
                    </>
                  )}

                  {/* Video Player URL - Only for Video Player Overlay */}
                  {overlayAdPosition === 'videoPlayer' && (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>VIDEO/IMAGE/GIF URL OR UPLOAD</label>
                        <input 
                          value={overlayVideoUrl} 
                          onChange={(e) => setOverlayVideoUrl(e.target.value)} 
                          placeholder="e.g., https://example.com/video.mp4" 
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, marginBottom: 8 }} 
                        />
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 8, fontWeight: 500 }}>OR upload from device:</label>
                          <label style={{ 
                            display: 'inline-block',
                            padding: '10px 16px',
                            background: '#3b82f6',
                            color: '#fff',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: 'none',
                            transition: 'background 0.2s'
                          }}>
                            📁 Choose File
                            <input 
                              type="file"
                              accept="video/*,image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const formData = new FormData();
                                  formData.append('media', file);
                                  fetch(`${getStaffBackendBaseUrl()}/staff/upload-overlay-media`, {
                                    method: 'POST',
                                    body: formData
                                  })
                                  .then(res => res.json())
                                  .then(data => {
                                    if (data.success) {
                                      setOverlayVideoUrl(data.url);
                                      setToast({ type: 'success', title: 'Uploaded', message: 'Media uploaded successfully!' });
                                    } else {
                                      setToast({ type: 'error', title: 'Upload failed', message: data.error || 'Failed to upload media' });
                                    }
                                  })
                                  .catch(err => {
                                    console.error('Upload error:', err);
                                    setToast({ type: 'error', title: 'Upload error', message: 'Error uploading file' });
                                  });
                                }
                              }}
                              style={{ display: 'none' }} 
                            />
                          </label>
                        </div>
                        {overlayVideoUrl && (
                          <div style={{ fontSize: 11, color: '#10b981' }}>✓ Media loaded successfully</div>
                        )}
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>Supports MP4, WebM, images, and GIFs</div>
                      </div>

                      {/* Exit Transition Effect */}
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>EXIT TRANSITION EFFECT</label>
                        <div tabIndex={0} onBlur={() => setOverlayExitTransitionOpen(false)} style={{ position: 'relative' }}>
                          <button onClick={() => setOverlayExitTransitionOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, border: '2px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 14, transition: 'all 0.2s ease', borderColor: overlayExitTransitionOpen ? '#0b74de' : '#e5e7eb', backgroundColor: overlayExitTransitionOpen ? '#f0f9ff' : 'white' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {overlayExitTransition === 'fade' && '✨ Fade'}
                              {overlayExitTransition === 'dissolve' && '💫 Dissolve'}
                              {overlayExitTransition === 'blinds' && '🪟 Blinds'}
                              {overlayExitTransition === 'wilt' && '🌹 Wilt'}
                              {overlayExitTransition === 'random' && '🎲 Random'}
                            </span>
                            <ChevronDown size={16} style={{ transition: 'transform 0.2s ease', transform: overlayExitTransitionOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                          </button>
                          {overlayExitTransitionOpen && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 4, zIndex: 10, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                              {['fade', 'dissolve', 'blinds', 'wilt', 'random'].map((effect) => (
                                <button
                                  key={effect}
                                  onClick={() => {
                                    setOverlayExitTransition(effect);
                                    setOverlayExitTransitionOpen(false);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: 'none',
                                    background: overlayExitTransition === effect ? '#f0f9ff' : 'transparent',
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    textAlign: 'left',
                                    color: overlayExitTransition === effect ? '#0b74de' : '#374151',
                                    fontWeight: overlayExitTransition === effect ? 600 : 400,
                                    borderLeft: overlayExitTransition === effect ? '3px solid #0b74de' : '3px solid transparent',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {effect === 'fade' && '✨ Fade - Simple opacity fade-out'}
                                  {effect === 'dissolve' && '💫 Dissolve - Fade with shrink'}
                                  {effect === 'blinds' && '🪟 Blinds - Collapse from top'}
                                  {effect === 'wilt' && '🌹 Wilt - Dramatic fold & rotate'}
                                  {effect === 'random' && '🎲 Random - Pick random effect'}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AD/Sponsored Badge Settings */}
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>BADGE TYPE</label>
                        <div tabIndex={0} onBlur={() => setOverlayBadgeTypeOpen(false)} style={{ position: 'relative' }}>
                          <button onClick={() => setOverlayBadgeTypeOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, border: '2px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 14, transition: 'all 0.2s ease', borderColor: overlayBadgeTypeOpen ? '#0b74de' : '#e5e7eb', backgroundColor: overlayBadgeTypeOpen ? '#f0f9ff' : 'white' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {overlayBadgeType === 'ad' && '🏷️ AD Tag'}
                              {overlayBadgeType === 'sponsoredBy' && '🎯 Sponsored By'}
                              {overlayBadgeType === 'none' && '❌ None'}
                            </span>
                            <ChevronDown size={16} style={{ transition: 'transform 0.2s ease', transform: overlayBadgeTypeOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                          </button>
                          {overlayBadgeTypeOpen && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '2px solid #e5e7eb', borderRadius: 8, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                              <div onMouseDown={(e) => { e.preventDefault(); setOverlayBadgeType('ad'); setOverlayBadgeTypeOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayBadgeType === 'ad' ? '#dbeafe' : 'transparent', color: overlayBadgeType === 'ad' ? '#0b74de' : '#1f2937', borderLeft: overlayBadgeType === 'ad' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayBadgeType === 'ad' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayBadgeType === 'ad' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayBadgeType === 'ad' ? '#dbeafe' : 'transparent'; }}>🏷️ AD Tag (Default)</div>
                              <div onMouseDown={(e) => { e.preventDefault(); setOverlayBadgeType('sponsoredBy'); setOverlayBadgeTypeOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayBadgeType === 'sponsoredBy' ? '#dbeafe' : 'transparent', color: overlayBadgeType === 'sponsoredBy' ? '#0b74de' : '#1f2937', borderLeft: overlayBadgeType === 'sponsoredBy' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayBadgeType === 'sponsoredBy' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayBadgeType === 'sponsoredBy' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayBadgeType === 'sponsoredBy' ? '#dbeafe' : 'transparent'; }}>🎯 Sponsored By + Logo</div>
                              <div onMouseDown={(e) => { e.preventDefault(); setOverlayBadgeType('none'); setOverlayBadgeTypeOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayBadgeType === 'none' ? '#dbeafe' : 'transparent', color: overlayBadgeType === 'none' ? '#0b74de' : '#1f2937', borderLeft: overlayBadgeType === 'none' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayBadgeType === 'none' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayBadgeType === 'none' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayBadgeType === 'none' ? '#dbeafe' : 'transparent'; }}>❌ None</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Badge Position Dropdown */}
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>BADGE POSITION</label>
                        <div tabIndex={0} onBlur={() => setOverlayBadgePositionOpen(false)} style={{ position: 'relative' }}>
                          <button onClick={() => setOverlayBadgePositionOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, border: '2px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 14, transition: 'all 0.2s ease', borderColor: overlayBadgePositionOpen ? '#0b74de' : '#e5e7eb', backgroundColor: overlayBadgePositionOpen ? '#f0f9ff' : 'white' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                              {overlayBadgePosition === 'top-left-player' && '↖️ Top Left (Player)'}
                              {overlayBadgePosition === 'top-right-player' && '↗️ Top Right (Player)'}
                              {overlayBadgePosition === 'top-left-video' && '↖️ Top Left (Video)'}
                              {overlayBadgePosition === 'top-right-video' && '↗️ Top Right (Video)'}
                              {overlayBadgePosition === 'bottom-left-video' && '↙️ Bottom Left (Video)'}
                              {overlayBadgePosition === 'bottom-right-video' && '↘️ Bottom Right (Video)'}
                            </span>
                            <ChevronDown size={16} style={{ transition: 'transform 0.2s ease', transform: overlayBadgePositionOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                          </button>
                          {overlayBadgePositionOpen && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '2px solid #e5e7eb', borderRadius: 8, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                              <div onMouseDown={(e) => { e.preventDefault(); setOverlayBadgePosition('top-left-player'); setOverlayBadgePositionOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayBadgePosition === 'top-left-player' ? '#dbeafe' : 'transparent', color: overlayBadgePosition === 'top-left-player' ? '#0b74de' : '#1f2937', borderLeft: overlayBadgePosition === 'top-left-player' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayBadgePosition === 'top-left-player' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayBadgePosition === 'top-left-player' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayBadgePosition === 'top-left-player' ? '#dbeafe' : 'transparent'; }}>↖️ Top Left of Player</div>
                              <div onMouseDown={(e) => { e.preventDefault(); setOverlayBadgePosition('top-right-player'); setOverlayBadgePositionOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayBadgePosition === 'top-right-player' ? '#dbeafe' : 'transparent', color: overlayBadgePosition === 'top-right-player' ? '#0b74de' : '#1f2937', borderLeft: overlayBadgePosition === 'top-right-player' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayBadgePosition === 'top-right-player' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayBadgePosition === 'top-right-player' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayBadgePosition === 'top-right-player' ? '#dbeafe' : 'transparent'; }}>↗️ Top Right of Player</div>
                              <div onMouseDown={(e) => { e.preventDefault(); setOverlayBadgePosition('top-left-video'); setOverlayBadgePositionOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayBadgePosition === 'top-left-video' ? '#dbeafe' : 'transparent', color: overlayBadgePosition === 'top-left-video' ? '#0b74de' : '#1f2937', borderLeft: overlayBadgePosition === 'top-left-video' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayBadgePosition === 'top-left-video' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayBadgePosition === 'top-left-video' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayBadgePosition === 'top-left-video' ? '#dbeafe' : 'transparent'; }}>↖️ Top Left of Video</div>
                              <div onMouseDown={(e) => { e.preventDefault(); setOverlayBadgePosition('top-right-video'); setOverlayBadgePositionOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayBadgePosition === 'top-right-video' ? '#dbeafe' : 'transparent', color: overlayBadgePosition === 'top-right-video' ? '#0b74de' : '#1f2937', borderLeft: overlayBadgePosition === 'top-right-video' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayBadgePosition === 'top-right-video' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayBadgePosition === 'top-right-video' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayBadgePosition === 'top-right-video' ? '#dbeafe' : 'transparent'; }}>↗️ Top Right of Video</div>
                              <div onMouseDown={(e) => { e.preventDefault(); setOverlayBadgePosition('bottom-left-video'); setOverlayBadgePositionOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayBadgePosition === 'bottom-left-video' ? '#dbeafe' : 'transparent', color: overlayBadgePosition === 'bottom-left-video' ? '#0b74de' : '#1f2937', borderLeft: overlayBadgePosition === 'bottom-left-video' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayBadgePosition === 'bottom-left-video' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayBadgePosition === 'bottom-left-video' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayBadgePosition === 'bottom-left-video' ? '#dbeafe' : 'transparent'; }}>↙️ Bottom Left of Video</div>
                              <div onMouseDown={(e) => { e.preventDefault(); setOverlayBadgePosition('bottom-right-video'); setOverlayBadgePositionOpen(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.15s ease', backgroundColor: overlayBadgePosition === 'bottom-right-video' ? '#dbeafe' : 'transparent', color: overlayBadgePosition === 'bottom-right-video' ? '#0b74de' : '#1f2937', borderLeft: overlayBadgePosition === 'bottom-right-video' ? '3px solid #0b74de' : '3px solid transparent', paddingLeft: overlayBadgePosition === 'bottom-right-video' ? '13px' : '16px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = overlayBadgePosition === 'bottom-right-video' ? '#dbeafe' : '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = overlayBadgePosition === 'bottom-right-video' ? '#dbeafe' : 'transparent'; }}>↘️ Bottom Right of Video</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Badge Color */}
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>BADGE COLOR</label>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <div style={{ position: 'relative' }}>
                            <input 
                              type="color" 
                              value={overlayBadgeColor} 
                              onChange={(e) => setOverlayBadgeColor(e.target.value)}
                              style={{ width: 50, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'all 0.2s ease' }}
                            />
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <input 
                              type="text" 
                              value={overlayBadgeColor} 
                              onChange={(e) => setOverlayBadgeColor(e.target.value)}
                              placeholder="#ff0000"
                              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, fontFamily: 'monospace', transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                            />
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff6600', '#ff0066'].map(color => (
                                <button key={color} onClick={() => setOverlayBadgeColor(color)} style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: color, border: overlayBadgeColor === color ? '3px solid #1f2937' : '2px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title={color} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sponsor Logo URL (only show if sponsoredBy selected) */}
                      {overlayBadgeType === 'sponsoredBy' && (
                        <div style={{ marginBottom: 16 }}>
                          <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>SPONSOR LOGO URL</label>
                          <input 
                            value={overlayBadgeLogo} 
                            onChange={(e) => setOverlayBadgeLogo(e.target.value)}
                            placeholder="e.g., https://example.com/logo.png"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                          />
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>Logo will be displayed next to "Sponsored by" text</div>
                        </div>
                      )}

                      {/* Optional Text CTA */}
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>TEXT BUTTON (Optional)</label>
                        <input 
                          value={overlayCtaText} 
                          onChange={(e) => setOverlayCtaText(e.target.value)} 
                          placeholder="e.g., Learn More" 
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} 
                        />
                      </div>

                      {/* CTA Color - Only show if text is filled */}
                      {overlayCtaText && (
                        <div style={{ marginBottom: 16 }}>
                          <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>BUTTON COLOR</label>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ position: 'relative' }}>
                              <input 
                                type="color"
                                value={overlayCtaColor} 
                                onChange={(e) => setOverlayCtaColor(e.target.value)} 
                                style={{ width: 50, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'all 0.2s ease' }} 
                              />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <input 
                                type="text"
                                value={overlayCtaColor} 
                                onChange={(e) => setOverlayCtaColor(e.target.value)} 
                                placeholder="#4B9EFF" 
                                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, fontFamily: 'monospace', transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} 
                              />
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'].map(color => (
                                  <button key={color} onClick={() => setOverlayCtaColor(color)} style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: color, border: overlayCtaColor === color ? '3px solid #1f2937' : '2px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title={color} />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CTA Timing - Show if CTA is configured */}
                      {((overlayCtaType === 'text' && overlayCtaText) || (overlayCtaType !== 'text' && overlayCtaMedia)) && (
                        <>
                          <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>CTA DELAY (seconds)</label>
                            <input 
                              type="number"
                              min="0"
                              max="30"
                              value={overlayCtaDelay} 
                              onChange={(e) => setOverlayCtaDelay(Math.max(0, parseInt(e.target.value) || 0))} 
                              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} 
                            />
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>How many seconds before CTA appears</div>
                          </div>

                          <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>CTA DURATION (seconds)</label>
                            <input 
                              type="number"
                              min="1"
                              max="30"
                              value={overlayCtaDuration} 
                              onChange={(e) => setOverlayCtaDuration(Math.max(1, parseInt(e.target.value) || 3))} 
                              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} 
                            />
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>How many seconds the CTA is visible</div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* Multiple Text Items */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>TICKER MESSAGES</label>
                      <button onClick={() => setOverlayAdTextItems([...overlayAdTextItems, { id: Date.now(), text: '', duration: 5 }])} style={{ padding: '6px 10px', borderRadius: 6, background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>+ Add Message</button>
                    </div>
                    {overlayAdTextItems.length === 0 ? (
                      <div style={{ padding: 10, background: '#f9fafb', borderRadius: 8, color: '#9ca3af', fontSize: 12 }}>No messages yet. Click "Add Message" to get started.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {overlayAdTextItems.map((item, idx) => (
                          <div key={item.id} style={{ padding: 10, background: '#f9fafb', borderRadius: 8, display: 'grid', gridTemplateColumns: '1fr 70px 60px', gap: 8, alignItems: 'center' }}>
                            <input value={item.text} onChange={(e) => setOverlayAdTextItems(overlayAdTextItems.map((i, ii) => ii === idx ? { ...i, text: e.target.value } : i))} placeholder="Message..." style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, minWidth: 0 }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input type="number" min="1" max="30" value={item.duration} onChange={(e) => setOverlayAdTextItems(overlayAdTextItems.map((i, ii) => ii === idx ? { ...i, duration: Number(e.target.value) } : i))} style={{ width: '100%', padding: '5px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11 }} />
                              <span style={{ fontSize: 10, color: '#9ca3af', whiteSpace: 'nowrap' }}>s</span>
                            </div>
                            <button onClick={() => setOverlayAdTextItems(overlayAdTextItems.filter((_, ii) => ii !== idx))} style={{ padding: '5px 8px', borderRadius: 6, background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: 16 }}>
                    <button onClick={() => { setAdsMode(null); }} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>Close</button>
                      <button onClick={() => {
                        if (!overlayAdCompanyName || (overlayAdPosition !== 'videoPlayer' && (overlayAdTextItems.length === 0 && !overlayAdText)) || (overlayAdPosition === 'videoPlayer' && !overlayVideoUrl)) { 
                          setToast({ type: 'error', title: 'Missing fields', message: 'Please provide company name' + (overlayAdPosition === 'videoPlayer' ? ' and video/image/GIF' : ' and at least one message') + '.' }); 
                          return; 
                        }
                        setOverlayTemplateName('');
                        setShowOverlaySaveModal(true);
                      }} style={{ padding: '9px 16px', borderRadius: 8, background: '#8b5cf6', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>Save Template</button>
                      <button onClick={() => {
                        if (!overlayAdCompanyName || (overlayAdPosition !== 'videoPlayer' && (overlayAdTextItems.length === 0 && !overlayAdText)) || (overlayAdPosition === 'videoPlayer' && !overlayVideoUrl)) { 
                          setToast({ type: 'error', title: 'Missing fields', message: 'Please provide company name' + (overlayAdPosition === 'videoPlayer' ? ' and video/image/GIF' : ' and at least one message') + '.' }); 
                          return; 
                        }
                        setShowOverlayPreview(true);
                      }} style={{ padding: '9px 16px', borderRadius: 8, background: '#111827', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>Preview</button>
                      <button onClick={() => setShowOverlayTemplatesModal(true)} style={{ padding: '9px 16px', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Templates ({overlayTemplates.length})</button>
                      <button onClick={() => {
                        if (!overlayAdCompanyName || (overlayAdPosition !== 'videoPlayer' && (overlayAdTextItems.length === 0 && !overlayAdText)) || (overlayAdPosition === 'videoPlayer' && !overlayVideoUrl)) { 
                          setToast({ type: 'error', title: 'Missing fields', message: 'Please provide company name' + (overlayAdPosition === 'videoPlayer' ? ' and video/image/GIF' : ' and at least one message') + '.' }); 
                          return; 
                        }
                        setShowOverlayApplyModal(true);
                      }} style={{ padding: '9px 16px', borderRadius: 8, background: '#0b74de', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Apply</button>
                  </div>
                </div>
              )}
              
              {/* Save Template Modal */}
              {showOverlaySaveModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowOverlaySaveModal(false)}>
                  <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 700, color: '#1f2937' }}>Save Overlay Template</h2>
                    <p style={{ margin: '0 0 20px 0', fontSize: 13, color: '#6b7280' }}>Give your overlay template a name to save it for later use.</p>
                    
                    <input 
                      value={overlayTemplateName} 
                      onChange={(e) => setOverlayTemplateName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && overlayTemplateName.trim()) {
                          const newTemplate = {
                            id: Date.now(),
                            name: overlayTemplateName.trim(),
                            companyName: overlayAdCompanyName,
                            text: overlayAdText,
                            textItems: overlayAdTextItems,
                            emoji: overlayAdEmoji,
                            bgColor: overlayAdBgColor,
                            textColor: overlayAdTextColor,
                            brandBgColor: overlayBrandBgColor,
                            brandTextColor: overlayBrandTextColor,
                            opacity: overlayAdOpacity,
                            tagOpacity: overlayTagOpacity,
                            position: overlayAdPosition,
                            animation: overlayTextAnimation,
                            videoUrl: overlayVideoUrl,
                            videoText: overlayAdText,
                            btnText: overlayBtnText,
                            badgeType: overlayBadgeType,
                            badgeColor: overlayBadgeColor,
                            badgeLogo: overlayBadgeLogo,
                            badgePosition: overlayBadgePosition
                          };
                          const updated = [...overlayTemplates, newTemplate];
                          setOverlayTemplates(updated);
                          localStorage.setItem('overlayTemplates', JSON.stringify(updated));
                          // TODO: Save to backend
                          setToast({ type: 'success', title: 'Saved', message: `Template "${overlayTemplateName}" saved successfully.` });
                          setShowOverlaySaveModal(false);
                          setOverlayTemplateName('');
                        }
                      }}
                      placeholder="E.g., Flash Sale, New Product..." 
                      autoFocus
                      style={{ width: '100%', padding: '12px', borderRadius: 8, border: '2px solid #e5e7eb', fontSize: 14, marginBottom: 20, boxSizing: 'border-box' }}
                    />
                    
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => setShowOverlaySaveModal(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Cancel</button>
                      <button onClick={() => {
                        if (!overlayTemplateName.trim()) {
                          setToast({ type: 'error', title: 'Name required', message: 'Please enter a template name.' });
                          return;
                        }
                        const newTemplate = {
                          id: Date.now(),
                          name: overlayTemplateName.trim(),
                          companyName: overlayAdCompanyName,
                          text: overlayAdText,
                          textItems: overlayAdTextItems,
                          emoji: overlayAdEmoji,
                          bgColor: overlayAdBgColor,
                          textColor: overlayAdTextColor,
                          brandBgColor: overlayBrandBgColor,
                          brandTextColor: overlayBrandTextColor,
                          opacity: overlayAdOpacity,
                          tagOpacity: overlayTagOpacity,
                          position: overlayAdPosition,
                          animation: overlayTextAnimation,
                          videoUrl: overlayVideoUrl,
                          videoText: overlayAdText,
                          btnText: overlayBtnText,
                          badgeType: overlayBadgeType,
                          badgeColor: overlayBadgeColor,
                          badgeLogo: overlayBadgeLogo,
                          badgePosition: overlayBadgePosition
                        };
                        const updated = [...overlayTemplates, newTemplate];
                        setOverlayTemplates(updated);
                        localStorage.setItem('overlayTemplates', JSON.stringify(updated));
                        // TODO: Save to backend
                        setToast({ type: 'success', title: 'Saved', message: `Template "${overlayTemplateName}" saved successfully.` });
                        setShowOverlaySaveModal(false);
                        setOverlayTemplateName('');
                      }} disabled={!overlayTemplateName.trim()} style={{ padding: '10px 16px', borderRadius: 8, background: overlayTemplateName.trim() ? '#8b5cf6' : '#d1d5db', color: 'white', border: 'none', cursor: overlayTemplateName.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 13 }}>Save</button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Saved Overlay Templates Modal */}
              {showOverlayTemplatesModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowOverlayTemplatesModal(false)}>
                  <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 720, maxHeight: '88vh', overflowY: 'auto', background: 'white', borderRadius: 16, padding: 0, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                    {/* Header */}
                    <div style={{ padding: '28px 32px', borderBottom: '1px solid #e5e7eb', background: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <h2 style={{ margin: '0 0 8px 0', fontSize: 22, fontWeight: 700, color: '#111827' }}>Saved Overlay Templates</h2>
                          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Manage your news ticker templates</p>
                        </div>
                        <button onClick={() => setShowOverlayTemplatesModal(false)} style={{ padding: '8px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Close</button>
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '24px 32px' }}>
                      {overlayTemplates.length === 0 ? (
                        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                          <div style={{ fontSize: 56, marginBottom: 12 }}>📺</div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 6 }}>No templates yet</div>
                          <div style={{ fontSize: 13, color: '#6b7280' }}>Create your first template to get started</div>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
                          {overlayTemplates.map((tpl) => (
                            <div key={tpl.id} className="template-card" style={{ padding: '20px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                              <div className="template-card-content" style={{ display: 'flex', alignItems: 'stretch', gap: 16, justifyContent: 'space-between' }}>
                                {/* Template Info */}
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 10 }}>{tpl.name}</div>
                                  <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#6b7280', marginBottom: 10, flexWrap: 'wrap' }}>
                                    <span>📢 <strong>{tpl.companyName}</strong></span>
                                    <span>✨ {tpl.animation}</span>
                                    <span>💬 {tpl.textItems?.length || 0} msg{(tpl.textItems?.length || 0) !== 1 ? 's' : ''}</span>
                                  </div>
                                  {/* Mini Preview */}
                                  <div style={{ padding: '12px 14px', background: tpl.bgColor, borderRadius: 8, overflow: 'hidden' }}>
                                    <div style={{ color: tpl.textColor, fontSize: 12, fontWeight: 600, opacity: 0.8 }}>
                                      {tpl.emoji} {tpl.companyName}
                                    </div>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="template-actions" style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center', flexShrink: 0 }}>
                                  <button onClick={() => {
                                    // Load template
                                    setOverlayAdCompanyName(tpl.companyName || '');
                                    setOverlayAdText(tpl.text || '');
                                    setOverlayAdTextItems(tpl.textItems || []);
                                    setOverlayAdEmoji(tpl.emoji || '⚡');
                                    setOverlayAdBgColor(tpl.bgColor || '#E41E24');
                                    setOverlayAdTextColor(tpl.textColor || '#fff');
                                    setOverlayBrandBgColor(tpl.brandBgColor || '#ffffff');
                                    setOverlayBrandTextColor(tpl.brandTextColor || '#000000');
                                    setOverlayAdOpacity(tpl.opacity != null ? tpl.opacity : 1);
                                    setOverlayTagOpacity(tpl.tagOpacity != null ? tpl.tagOpacity : 1);
                                    setOverlayAdPosition(tpl.position || 'bottom');
                                    setOverlayTextAnimation(tpl.animation || 'marquee');
                                    // Load video-related fields
                                    setOverlayVideoUrl(tpl.videoUrl || '');
                                    setOverlayExitTransition(tpl.overlayExitTransition || 'fade');
                                    setOverlayBtnText(tpl.btnText || 'Learn More');
                                    setOverlayBadgeType(tpl.badgeType || 'ad');
                                    setOverlayBadgeColor(tpl.badgeColor || '#ff0000');
                                    setOverlayBadgeLogo(tpl.badgeLogo || '');
                                    setOverlayBadgePosition(tpl.badgePosition || 'top-left-video');
                                    setShowOverlayTemplatesModal(false);
                                    setAdsMode('overlay');
                                    setToast({ type: 'success', title: 'Loaded', message: `Template "${tpl.name}" loaded.` });
                                  }} style={{ padding: '10px 16px', borderRadius: 8, background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>✓ Apply</button>
                                  <button onClick={() => {
                                    const updated = overlayTemplates.filter(t => t.id !== tpl.id);
                                    setOverlayTemplates(updated);
                                    localStorage.setItem('overlayTemplates', JSON.stringify(updated));
                                    setToast({ type: 'success', title: 'Deleted', message: `Template "${tpl.name}" deleted.` });
                                  }} style={{ padding: '10px 16px', borderRadius: 8, background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>🗑 Delete</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {showBottomApplyModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowBottomApplyModal(false)}>
                  <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', background: 'white', borderRadius: 12, padding: 24 }}>
                    <h2 style={{ margin: '0 0 20px 0', fontSize: 20, fontWeight: 700 }}>Apply Bottom Ad to Videos</h2>
                    
                    {/* Search Input */}
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Search Videos</label>
                      <input 
                        value={bottomApplyVideoSearch} 
                        onChange={(e) => setBottomApplyVideoSearch(e.target.value)} 
                        placeholder="Search by title or author..." 
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                      />
                    </div>

                    {/* Time Controls */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Start Time (seconds)</label>
                        <input type="number" min={0} value={bottomApplyStartTime} onChange={(e) => setBottomApplyStartTime(Math.max(0, Number(e.target.value)))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Duration (seconds)</label>
                        <input type="number" min={1} value={bottomApplyDuration} onChange={(e) => setBottomApplyDuration(Math.max(1, Number(e.target.value)))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Max Display Count</label>
                        <input type="number" min={1} value={bottomApplyDisplayCount} onChange={(e) => setBottomApplyDisplayCount(Math.max(1, Number(e.target.value)))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                      </div>
                    </div>

                    {/* Video List */}
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Select Videos (showing ad count)</label>
                      <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                        {videos.filter(v => !bottomApplyVideoSearch || v.title.toLowerCase().includes(bottomApplyVideoSearch.toLowerCase()) || (v.author && v.author.toLowerCase().includes(bottomApplyVideoSearch.toLowerCase()))).length === 0 ? (
                          <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af' }}>No videos found</div>
                        ) : (
                          videos.filter(v => !bottomApplyVideoSearch || v.title.toLowerCase().includes(bottomApplyVideoSearch.toLowerCase()) || (v.author && v.author.toLowerCase().includes(bottomApplyVideoSearch.toLowerCase()))).map(video => {
                            const adCount = (video.ads?.bottom?.length || 0) + (video.ads?.overlays?.length || 0);
                            return (
                              <div key={video.id} style={{ padding: 10, borderRadius: 6, marginBottom: 6, background: bottomApplySelectedVideos.includes(video.id) ? '#dbeafe' : '#f9fafb', border: `2px solid ${bottomApplySelectedVideos.includes(video.id) ? '#0b74de' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.2s ease' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }} onClick={() => setBottomApplySelectedVideos(bottomApplySelectedVideos.includes(video.id) ? bottomApplySelectedVideos.filter(id => id !== video.id) : [...bottomApplySelectedVideos, video.id])}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                                    <input type="checkbox" checked={bottomApplySelectedVideos.includes(video.id)} readOnly style={{ cursor: 'pointer' }} />
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>{video.title}</div>
                                      <div style={{ fontSize: 12, color: '#9ca3af' }}>by {video.author || 'Unknown'}</div>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {adCount > 0 && (
                                      <span style={{ padding: '4px 8px', background: '#fef08a', color: '#854d0e', fontSize: 12, fontWeight: 600, borderRadius: 4 }}>
                                        {adCount} ad{adCount !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                    {adCount > 0 && (
                                      <button onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedVideoForAdMgmt(video);
                                      }} style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => setShowBottomApplyModal(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Cancel</button>
                      <button onClick={handleApplyBottomAd} style={{ padding: '10px 16px', borderRadius: 8, background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Apply to Videos</button>
                    </div>
                  </div>
                </div>
              )}
              
              {showOverlayApplyModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowOverlayApplyModal(false)}>
                  <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', background: 'white', borderRadius: 12, padding: 24 }}>
                    <h2 style={{ margin: '0 0 20px 0', fontSize: 20, fontWeight: 700 }}>Apply Overlay to Videos</h2>
                    
                    {/* Search Input */}
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Search Videos</label>
                      <input 
                        value={overlayApplyVideoSearch} 
                        onChange={(e) => setOverlayApplyVideoSearch(e.target.value)} 
                        placeholder="Search by title or author..." 
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                      />
                    </div>

                    {/* Time Controls */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Start Time (seconds)</label>
                        <input type="number" min={0} value={overlayApplyStartTime} onChange={(e) => setOverlayApplyStartTime(Math.max(0, Number(e.target.value)))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Duration (seconds)</label>
                        <input type="number" min={1} value={overlayApplyEndTime} onChange={(e) => setOverlayApplyEndTime(Math.max(1, Number(e.target.value)))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                      </div>
                    </div>

                    {/* Video List */}
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Select Videos (showing total ad count - all positions)</label>
                      <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                        {videos.filter(v => !overlayApplyVideoSearch || v.title.toLowerCase().includes(overlayApplyVideoSearch.toLowerCase()) || (v.author && v.author.toLowerCase().includes(overlayApplyVideoSearch.toLowerCase()))).length === 0 ? (
                          <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af' }}>No videos found</div>
                        ) : (
                          videos.filter(v => !overlayApplyVideoSearch || v.title.toLowerCase().includes(overlayApplyVideoSearch.toLowerCase()) || (v.author && v.author.toLowerCase().includes(overlayApplyVideoSearch.toLowerCase()))).map(video => {
                            const adCount = (video.ads?.bottom?.length || 0) + (video.ads?.overlays?.length || 0);
                            return (
                              <div key={video.id} style={{ padding: 10, borderRadius: 6, marginBottom: 6, background: overlayApplySelectedVideos.includes(video.id) ? '#dbeafe' : '#f9fafb', border: `2px solid ${overlayApplySelectedVideos.includes(video.id) ? '#0b74de' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.2s ease' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }} onClick={() => setOverlayApplySelectedVideos(overlayApplySelectedVideos.includes(video.id) ? overlayApplySelectedVideos.filter(id => id !== video.id) : [...overlayApplySelectedVideos, video.id])}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                                    <input type="checkbox" checked={overlayApplySelectedVideos.includes(video.id)} readOnly style={{ cursor: 'pointer' }} />
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>{video.title}</div>
                                      <div style={{ fontSize: 12, color: '#9ca3af' }}>by {video.author || 'Unknown'}</div>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {adCount > 0 && (
                                      <span style={{ padding: '4px 8px', background: '#fef08a', color: '#854d0e', fontSize: 12, fontWeight: 600, borderRadius: 4 }}>
                                        {adCount} ad{adCount !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                    {adCount > 0 && (
                                      <button onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedVideoForAdMgmt(video);
                                      }} style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => setShowOverlayApplyModal(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Cancel</button>
                      <button onClick={handleApplyOverlayAd} style={{ padding: '10px 16px', borderRadius: 8, background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Apply to Videos</button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Bottom ad preview overlay */}
              {showBottomPreview && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} onClick={() => setShowBottomPreview(false)}>
                  <style>{`
                    @keyframes fadeInOut {
                      0%, 100% { opacity: 0; }
                      10% { opacity: 1; }
                      90% { opacity: 1; }
                    }
                    @keyframes slideLeftIn {
                      from { transform: translateX(20px); opacity: 0; }
                      to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes slideRightIn {
                      from { transform: translateX(-20px); opacity: 0; }
                      to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes bounceIn {
                      0% { transform: scale(0.8); opacity: 0; }
                      50% { transform: scale(1.05); }
                      100% { transform: scale(1); opacity: 1; }
                    }
                    @keyframes scaleIn {
                      from { transform: scale(0.95); opacity: 0; }
                      to { transform: scale(1); opacity: 1; }
                    }
                    @keyframes lineAppear {
                      from { width: 0; }
                      to { width: 3px; }
                    }
                    @keyframes slideDown {
                      from { transform: translateY(-20px); opacity: 0; }
                      to { transform: translateY(0); opacity: 1; }
                    }
                    @keyframes bounceInCard {
                      0% { transform: scale(0.8) translateY(-20px); opacity: 0; }
                      50% { transform: scale(1.02); }
                      100% { transform: scale(1) translateY(0); opacity: 1; }
                    }
                    @keyframes scaleUpCard {
                      from { transform: scale(0.9); opacity: 0; }
                      to { transform: scale(1); opacity: 1; }
                    }
                    @keyframes pulse {
                      0%, 100% { transform: scale(1); opacity: 1; }
                      50% { transform: scale(1.02); opacity: 0.95; }
                    }
                    @keyframes shake {
                      0%, 100% { transform: translateX(0); }
                      10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                      20%, 40%, 60%, 80% { transform: translateX(2px); }
                    }
                    @keyframes glow {
                      0%, 100% { box-shadow: 0 0 5px rgba(139, 92, 246, 0.5), 0 4px 12px rgba(17, 24, 39, 0.3); }
                      50% { box-shadow: 0 0 15px rgba(139, 92, 246, 0.8), 0 4px 12px rgba(17, 24, 39, 0.3); }
                    }
                    @keyframes float {
                      0%, 100% { transform: translateY(0px); }
                      50% { transform: translateY(-4px); }
                    }
                    @keyframes rotate {
                      0% { transform: rotate(0deg) scale(1); }
                      50% { transform: rotate(1deg) scale(1.01); }
                      100% { transform: rotate(0deg) scale(1); }
                    }
                  `}</style>
                  <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Top-right close button (smaller) */}
                    <button onClick={() => setShowBottomPreview(false)} style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top, 20px) + 14px)', right: 14, zIndex: 1420, background: 'rgba(255,255,255,0.04)', border: 'none', color: 'white', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', fontSize: 14, opacity: 0.95 }}>✕</button>

                    {/* Minimal header to reduce clutter (toggleable) - portrait only */}
                    {previewShowAdBar && !previewLandscape && (
                      <div style={{ position: 'absolute', top: 'env(safe-area-inset-top, 20px)', left: 0, right: 0, height: 32, background: 'transparent', display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', color: '#cbd5e1', fontSize: 12, opacity: 0.9, zIndex: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 6, background: '#ef4444' }} />
                      <div style={{ width: 10, height: 10, borderRadius: 6, background: '#f59e0b' }} />
                      <div style={{ width: 10, height: 10, borderRadius: 6, background: '#10b981' }} />
                      <div style={{ marginLeft: 8, fontWeight: 700 }}>Video Preview</div>
                      <div style={{ flex: 1 }} />
                      <div style={{ opacity: 0.75, fontSize: 11 }}>360x640</div>
                      </div>
                    )}

                    {/* Fullscreen video area with placeholder and orientation/ad-bar toggles */}
                    <div style={{ position: 'absolute', top: previewShowAdBar && !previewLandscape ? 'calc(env(safe-area-inset-top, 20px) + 32px)' : 'env(safe-area-inset-top, 20px)', bottom: 'env(safe-area-inset-bottom, 20px)', left: 0, right: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                      {/* Determine video asset */}
                      {(() => {
                        const videoSrc = adAssets.find(a => a.type === 'video')?.url || '';
                        const wrapperStyle = previewLandscape
                          ? { width: '100vw', height: '100vh', background: '#000', borderRadius: 0, overflow: 'hidden', boxShadow: 'none' }
                          : { width: '100%', maxWidth: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' };

                        // SVG placeholder (16:9) encoded as data URL
                        const placeholderSvg = encodeURIComponent(`
                          <svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'>
                            <rect width='100%' height='100%' fill='#111827' />
                            <g fill='#9ca3af' font-family='Arial, Helvetica, sans-serif' font-size='40' text-anchor='middle'>
                              <text x='50%' y='48%'>No video uploaded</text>
                              <text x='50%' y='62%' font-size='28'>Placeholder 16:9</text>
                            </g>
                          </svg>
                        `);

                        return (
                          <div style={wrapperStyle}>
                            {videoSrc ? (
                              <video id="bottom-ad-preview-video" src={videoSrc} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000', display: 'block' }} onError={() => { /* ignore */ }} />
                            ) : (
                              <img alt="placeholder" src={`data:image/svg+xml;utf8,${placeholderSvg}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            )}

                                {/* Show corner button when cornerButton position is selected */}
                                {overlayAdPosition === 'cornerButton' && (
                                  <button
                                    style={{
                                      position: 'absolute',
                                      bottom: 20,
                                      right: 16,
                                      padding: '10px 16px',
                                      background: 'linear-gradient(135deg, #ff0080 0%, #ff8c00 100%)',
                                      color: '#ffffff',
                                      border: '2px solid #ff0080',
                                      borderRadius: 8,
                                      fontSize: 13,
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      boxShadow: '0 4px 12px rgba(255, 0, 128, 0.4)',
                                      transition: 'all 0.2s ease',
                                      whiteSpace: 'nowrap',
                                      zIndex: 100
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 0, 128, 0.6)';
                                      e.currentTarget.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 0, 128, 0.4)';
                                      e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                  >
                                    Visit Link
                                  </button>
                                )}

                                {/* Show bottom ad bar for other positions */}
                                {overlayAdPosition !== 'cornerButton' && (
                                  <BottomAdPreviewBar
                                    profileName={bottomAdProfileName}
                                    profileAvatar={bottomAdProfileAvatar}
                                    textItems={bottomAdTextItems}
                                    textInterval={bottomAdTextInterval}
                                    textAnimation={bottomAdTextAnimation}
                                    cardAnimation={bottomAdCardAnimation}
                                    cardEffect={bottomAdCardEffect}
                                    link={bottomAdLink}
                                  />
                                )}
                          </div>
                        );
                      })()}

                      {/* Small overlay controls: show/hide ad bar, landscape toggle */}
                      <div style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top, 20px) + 14px)', right: 56, zIndex: 1425, display: 'flex', gap: 8 }}>
                        <button onClick={(e) => { e.stopPropagation(); setPreviewShowAdBar(s => !s); }} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#e6eef8', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>{previewShowAdBar ? 'Hide Header' : 'Show Header'}</button>
                        <button onClick={(e) => { e.stopPropagation(); saveBottomAdTemplate(); }} style={{ background: '#0b74de', border: 'none', color: '#fff', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>Save Template</button>
                        <button onClick={(e) => { e.stopPropagation(); setPreviewLandscape(s => !s); }} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#e6eef8', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>{previewLandscape ? 'Portrait' : 'Landscape'}</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Default 2 Save Template Modal */}
              {showDefault2SaveModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowDefault2SaveModal(false)}>
                  <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, background: 'white', borderRadius: 12, padding: 24 }}>
                    <h2 style={{ margin: '0 0 20px 0', fontSize: 20, fontWeight: 700 }}>Save as Template</h2>
                    
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Template Name</label>
                      <input 
                        value={default2TemplateName} 
                        onChange={(e) => setDefault2TemplateName(e.target.value)} 
                        placeholder="e.g., Summer Promo" 
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => setShowDefault2SaveModal(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Cancel</button>
                      <button onClick={() => {
                        if (!default2TemplateName.trim()) {
                          setToast({ type: 'error', title: 'Error', message: 'Please enter a template name' });
                          return;
                        }
                        const newTemplate = {
                          id: Date.now().toString(),
                          name: default2TemplateName,
                          lineColor: default2LineColor,
                          bgColor: default2BgColor,
                          textColor: default2TextColor,
                          title: default2Title,
                          description: default2Description,
                          logo: default2Logo,
                          link: default2Link
                        };
                        const updated = [...default2Templates, newTemplate];
                        setDefault2Templates(updated);
                        localStorage.setItem('default2Templates', JSON.stringify(updated));
                        setDefault2TemplateName('');
                        setShowDefault2SaveModal(false);
                        setToast({ type: 'success', title: 'Saved', message: `Template "${default2TemplateName}" saved!` });
                      }} style={{ padding: '10px 16px', borderRadius: 8, background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Save Template</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Default 2 Saved Templates Modal */}
              {showDefault2TemplatesModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowDefault2TemplatesModal(false)}>
                  <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 720, maxHeight: '88vh', overflowY: 'auto', background: 'white', borderRadius: 16, padding: 0, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                    {/* Header */}
                    <div style={{ padding: '28px 32px', borderBottom: '1px solid #e5e7eb', background: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <h2 style={{ margin: '0 0 8px 0', fontSize: 22, fontWeight: 700, color: '#111827' }}>Saved Default 2 Templates</h2>
                          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Manage your card ad templates</p>
                        </div>
                        <button onClick={() => setShowDefault2TemplatesModal(false)} style={{ padding: '8px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Close</button>
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '24px 32px' }}>
                      {default2Templates.length === 0 ? (
                        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                          <div style={{ fontSize: 56, marginBottom: 12 }}>🎨</div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 6 }}>No templates yet</div>
                          <div style={{ fontSize: 13, color: '#6b7280' }}>Create your first template to get started</div>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
                          {default2Templates.map((tpl) => (
                            <div key={tpl.id} className="template-card" style={{ padding: '20px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                              <div className="template-card-content" style={{ display: 'flex', alignItems: 'stretch', gap: 16, justifyContent: 'space-between' }}>
                                {/* Preview */}
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 12 }}>{tpl.name}</div>
                                  <div style={{ 
                                    padding: '14px 16px', 
                                    background: tpl.bgColor, 
                                    border: `2px solid ${tpl.lineColor}`,       
                                    borderRadius: 10,
                                    fontSize: 13
                                  }}>
                                    <div style={{ fontWeight: 700, color: tpl.textColor, marginBottom: 6, fontSize: 14 }}>{tpl.title || 'Title'}</div>
                                    <div style={{ color: tpl.textColor, opacity: 0.8, fontSize: 12, lineHeight: '1.4' }}>{tpl.description || 'Description'}</div>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="template-actions" style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center', flexShrink: 0 }}>
                                  <button onClick={() => {
                                    setDefault2LineColor(tpl.lineColor);
                                    setDefault2BgColor(tpl.bgColor);
                                    setDefault2TextColor(tpl.textColor);
                                    setDefault2Title(tpl.title);
                                    setDefault2Description(tpl.description);
                                    setDefault2Logo(tpl.logo);
                                    setDefault2Link(tpl.link);
                                    setShowDefault2TemplatesModal(false);
                                    setAdsMode('default2');
                                    setToast({ type: 'success', title: 'Loaded', message: `Template "${tpl.name}" loaded.` });
                                  }} style={{ padding: '10px 16px', borderRadius: 8, background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>✓ Apply</button>
                                  <button onClick={() => {
                                    const updated = default2Templates.filter(t => t.id !== tpl.id);
                                    setDefault2Templates(updated);
                                    localStorage.setItem('default2Templates', JSON.stringify(updated));
                                    setToast({ type: 'success', title: 'Deleted', message: `Template "${tpl.name}" deleted.` });
                                  }} style={{ padding: '10px 16px', borderRadius: 8, background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>🗑 Delete</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Default 2 Apply Modal */}
              {showDefault2ApplyModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowDefault2ApplyModal(false)}>
                  <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', background: 'white', borderRadius: 12, padding: 24 }}>
                    <h2 style={{ margin: '0 0 20px 0', fontSize: 20, fontWeight: 700 }}>Apply Default 2 Ad to Videos</h2>
                    
                    {/* Search Input */}
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Search Videos</label>
                      <input 
                        value={default2ApplyVideoSearch} 
                        onChange={(e) => setDefault2ApplyVideoSearch(e.target.value)} 
                        placeholder="Search by title or author..." 
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                      />
                    </div>

                    {/* Time Controls */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Start Time (seconds)</label>
                        <input type="number" min={0} value={default2ApplyStartTime} onChange={(e) => setDefault2ApplyStartTime(Math.max(0, Number(e.target.value)))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Duration (seconds)</label>
                        <input type="number" min={1} value={default2ApplyDuration} onChange={(e) => setDefault2ApplyDuration(Math.max(1, Number(e.target.value)))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Max Display Count</label>
                        <input type="number" min={1} value={default2ApplyDisplayCount} onChange={(e) => setDefault2ApplyDisplayCount(Math.max(1, Number(e.target.value)))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                      </div>
                    </div>

                    {/* Video List */}
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Select Videos (showing ad count)</label>
                      <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                        {videos.filter(v => !default2ApplyVideoSearch || v.title.toLowerCase().includes(default2ApplyVideoSearch.toLowerCase()) || (v.author && v.author.toLowerCase().includes(default2ApplyVideoSearch.toLowerCase()))).length === 0 ? (
                          <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af' }}>No videos found</div>
                        ) : (
                          videos.filter(v => !default2ApplyVideoSearch || v.title.toLowerCase().includes(default2ApplyVideoSearch.toLowerCase()) || (v.author && v.author.toLowerCase().includes(default2ApplyVideoSearch.toLowerCase()))).map(video => {
                            const adCount = (video.ads?.bottom?.length || 0) + (video.ads?.overlays?.length || 0) + (video.ads?.default2?.length || 0);
                            return (
                              <div key={video.id} style={{ padding: 10, borderRadius: 6, marginBottom: 6, background: default2ApplySelectedVideos.includes(video.id) ? '#dbeafe' : '#f9fafb', border: `2px solid ${default2ApplySelectedVideos.includes(video.id) ? '#0b74de' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.2s ease' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }} onClick={() => setDefault2ApplySelectedVideos(default2ApplySelectedVideos.includes(video.id) ? default2ApplySelectedVideos.filter(id => id !== video.id) : [...default2ApplySelectedVideos, video.id])}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                                    <input type="checkbox" checked={default2ApplySelectedVideos.includes(video.id)} readOnly style={{ cursor: 'pointer' }} />
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>{video.title}</div>
                                      <div style={{ fontSize: 12, color: '#9ca3af' }}>by {video.author || 'Unknown'}</div>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {adCount > 0 && (
                                      <span style={{ padding: '4px 8px', background: '#fef08a', color: '#854d0e', fontSize: 12, fontWeight: 600, borderRadius: 4 }}>
                                        {adCount} ad{adCount !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                    {adCount > 0 && (
                                      <button onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedVideoForAdMgmt(video);
                                      }} style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => setShowDefault2ApplyModal(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Cancel</button>
                      <button onClick={handleApplyDefault2Ad} style={{ padding: '10px 16px', borderRadius: 8, background: '#d946ef', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Apply to Videos</button>
                    </div>
                  </div>
                </div>
              )}
            
            </div>
          )}
        </div>

        {/* Promotion Modal */}
        {promotionModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            position: 'relative',
            maxWidth: '600px',
            width: '90%',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            maxHeight: '90vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Small absolute close button in top-right */}
            <button onClick={() => setPromotionModal({ isOpen: false, title: '', message: '', recipientType: 'individual', selectedUsers: [], promotionType: 'offer', ctaText: 'Learn More', ctaIcon: 'gift', ctaUrl: '' })} title="Close" style={{ position: 'absolute', top: '12px', right: '12px', width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>✕</button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', color: '#1f2937' }}>
                Create Promotion
              </h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  title="Templates"
                  onClick={() => setTemplatePickerOpen(true)}
                  style={{
                    backgroundColor: '#eef2ff',
                    border: 'none',
                    padding: '6px 8px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Templates
                </button>
                <button
                  title="Clear all fields"
                  onClick={() => {
                    setPromotionModal({ ...promotionModal, title: '', message: '', selectedUsers: [], recipientType: 'individual' });
                    setPromotionSearch('');
                    setError('');
                  }}
                  style={{
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    padding: '6px 8px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                Promotion Type
              </label>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setPromotionTypeDropdown(!promotionTypeDropdown)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#ffffff',
                    color: '#1f2937',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxSizing: 'border-box',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>
                    {promotionModal.promotionType === 'offer' && '🎁 Special Offer'}
                    {promotionModal.promotionType === 'announcement' && '📢 Announcement'}
                    {promotionModal.promotionType === 'feature' && '⭐ Featured'}
                  </span>
                  <ChevronDown size={18} style={{ transform: promotionTypeDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>
                {promotionTypeDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '2px solid #e5e7eb',
                    borderTop: 'none',
                    borderRadius: '0 0 6px 6px',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <button
                      onClick={() => {
                        setPromotionModal({ ...promotionModal, promotionType: 'offer' });
                        setPromotionTypeDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: promotionModal.promotionType === 'offer' ? '#f59e0b20' : 'white',
                        color: '#1f2937',
                        border: 'none',
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f59e0b10'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = promotionModal.promotionType === 'offer' ? '#f59e0b20' : 'white'}
                    >
                      <Gift size={18} style={{ color: '#f59e0b' }} /> Special Offer
                    </button>
                    <button
                      onClick={() => {
                        setPromotionModal({ ...promotionModal, promotionType: 'announcement' });
                        setPromotionTypeDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: promotionModal.promotionType === 'announcement' ? '#3b82f620' : 'white',
                        color: '#1f2937',
                        border: 'none',
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#3b82f610'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = promotionModal.promotionType === 'announcement' ? '#3b82f620' : 'white'}
                    >
                      <Megaphone size={18} style={{ color: '#3b82f6' }} /> Announcement
                    </button>
                    <button
                      onClick={() => {
                        setPromotionModal({ ...promotionModal, promotionType: 'feature' });
                        setPromotionTypeDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: promotionModal.promotionType === 'feature' ? '#10b98120' : 'white',
                        color: '#1f2937',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '0 0 6px 6px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#10b98110'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = promotionModal.promotionType === 'feature' ? '#10b98120' : 'white'}
                    >
                      <Star size={18} style={{ color: '#10b981' }} /> Featured
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                Title
              </label>
              <input
                type="text"
                value={promotionModal.title}
                onChange={(e) => setPromotionModal({ ...promotionModal, title: e.target.value })}
                placeholder="e.g., New Feature Launch, 50% Off Boost..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                Message
              </label>
              <textarea
                value={promotionModal.message}
                onChange={(e) => setPromotionModal({ ...promotionModal, message: e.target.value })}
                placeholder="Describe the promotion or announcement..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  minHeight: '100px',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                Send To
              </label>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setSendToDropdown(!sendToDropdown)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#ffffff',
                    color: '#1f2937',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxSizing: 'border-box',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>
                    {promotionModal.recipientType === 'all' && '📢 All Users'}
                    {promotionModal.recipientType === 'creators' && '👑 Creators Only'}
                    {promotionModal.recipientType === 'individual' && '👤 Select Users'}
                  </span>
                  <ChevronDown size={18} style={{ transform: sendToDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>
                {sendToDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '2px solid #e5e7eb',
                    borderTop: 'none',
                    borderRadius: '0 0 6px 6px',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <button
                      onClick={() => {
                        setPromotionModal({ ...promotionModal, recipientType: 'all' });
                        setSendToDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: promotionModal.recipientType === 'all' ? '#10b98120' : 'white',
                        color: '#1f2937',
                        border: 'none',
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#10b98110'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = promotionModal.recipientType === 'all' ? '#10b98120' : 'white'}
                    >
                      <Megaphone size={18} style={{ color: '#10b981' }} /> All Users
                    </button>
                    <button
                      onClick={() => {
                        setPromotionModal({ ...promotionModal, recipientType: 'creators' });
                        setSendToDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: promotionModal.recipientType === 'creators' ? '#f59e0b20' : 'white',
                        color: '#1f2937',
                        border: 'none',
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f59e0b10'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = promotionModal.recipientType === 'creators' ? '#f59e0b20' : 'white'}
                    >
                      <Crown size={18} style={{ color: '#f59e0b' }} /> Creators Only
                    </button>
                    <button
                      onClick={() => {
                        setPromotionModal({ ...promotionModal, recipientType: 'individual', selectedUsers: [] });
                        setSendToDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: promotionModal.recipientType === 'individual' ? '#3b82f620' : 'white',
                        color: '#1f2937',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '0 0 6px 6px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#3b82f610'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = promotionModal.recipientType === 'individual' ? '#3b82f620' : 'white'}
                    >
                      <Users size={18} style={{ color: '#3b82f6' }} /> Select Users
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* User Selection for Individual Promotions */}
            {promotionModal.recipientType === 'individual' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        
                        <label style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="checkbox"
                            checked={promotionModal.recipientType === 'all'}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPromotionModal({ ...promotionModal, recipientType: 'all', selectedUsers: users.map(u => u.id) });
                              } else {
                                setPromotionModal({ ...promotionModal, recipientType: 'individual', selectedUsers: [] });
                              }
                            }}
                          />
                          All users
                        </label>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => setShowPromotionFilters(!showPromotionFilters)}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: showPromotionFilters ? '#3b82f6' : '#e5e7eb',
                          color: showPromotionFilters ? 'white' : '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        Filters
                      </button>
                      <button
                        onClick={() => {
                          const visibleIds = filteredUsersForPromotion.map(u => u.id);
                          const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => promotionModal.selectedUsers.includes(id));
                          if (allVisibleSelected) {
                            setPromotionModal({ ...promotionModal, selectedUsers: promotionModal.selectedUsers.filter(id => !visibleIds.includes(id)) });
                          } else {
                            // Union current selection with visible ids
                            const union = Array.from(new Set([...promotionModal.selectedUsers, ...visibleIds]));
                            setPromotionModal({ ...promotionModal, selectedUsers: union });
                          }
                        }}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: '#e5e7eb',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        Select Visible
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input
                      value={promotionSearch}
                      onChange={(e) => setPromotionSearch(e.target.value)}
                      placeholder="Search users or creators..."
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                    />
                    <button
                      onClick={() => setShowPromotionFilters(!showPromotionFilters)}
                      aria-label="Toggle filters"
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '2px solid #e5e7eb',
                        background: '#eef2ff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Filter size={16} />
                    </button>
                  </div>

                  {showPromotionFilters && (
                    <div style={{ marginTop: '8px', padding: '16px', border: '2px solid #e5e7eb', borderRadius: '12px', background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                      {/* Row 1: Checkboxes */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151', padding: '8px 12px', background: 'white', borderRadius: '8px', border: '1.5px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                          <input type="checkbox" checked={creatorOnlyFilter} onChange={(e) => { setCreatorOnlyFilter(e.target.checked); if (e.target.checked) setUsersOnlyFilter(false); }} style={{ accentColor: '#3b82f6' }} />
                          Creators only
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151', padding: '8px 12px', background: 'white', borderRadius: '8px', border: '1.5px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                          <input type="checkbox" checked={usersOnlyFilter} onChange={(e) => { setUsersOnlyFilter(e.target.checked); if (e.target.checked) setCreatorOnlyFilter(false); }} style={{ accentColor: '#3b82f6' }} />
                          Users only
                        </label>
                      </div>

                      {/* Row 2: Category Tabs */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '8px', background: 'white', borderRadius: '8px', border: '1.5px solid #e5e7eb' }}>
                          <button
                            onClick={() => setCategoryFilter('all')}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: categoryFilter === 'all' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                              background: categoryFilter === 'all' ? '#dbeafe' : 'white',
                              color: categoryFilter === 'all' ? '#1e40af' : '#6b7280',
                              fontSize: '12px',
                              fontWeight: categoryFilter === 'all' ? '600' : '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { if (categoryFilter !== 'all') { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = '#d1d5db'; } }}
                            onMouseLeave={(e) => { if (categoryFilter !== 'all') { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e5e7eb'; } }}
                          >
                            All
                          </button>
                          {CATEGORY_TABS.map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setCategoryFilter(tab)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: categoryFilter === tab ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                background: categoryFilter === tab ? '#dbeafe' : 'white',
                                color: categoryFilter === tab ? '#1e40af' : '#6b7280',
                                fontSize: '12px',
                                fontWeight: categoryFilter === tab ? '600' : '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => { if (categoryFilter !== tab) { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = '#d1d5db'; } }}
                              onMouseLeave={(e) => { if (categoryFilter !== tab) { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e5e7eb'; } }}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Row 3: Dropdowns with beautiful UI */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                        {/* Subscription Dropdown */}
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subscription</label>
                          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #e5e7eb',
                            fontSize: '13px',
                            fontWeight: '500',
                            background: 'white',
                            color: '#374151',
                            cursor: 'pointer',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 10px center',
                            paddingRight: '32px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                          >
                            <option value="all">All Plans</option>
                            <option value="hasplan">Has Plan</option>
                            <option value="noplan">No Plan</option>
                          </select>
                        </div>

                        {/* Request Activity Dropdown */}
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Request Activity</label>
                          <select value={requestActivityFilter} onChange={(e) => setRequestActivityFilter(e.target.value)} style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #e5e7eb',
                            fontSize: '13px',
                            fontWeight: '500',
                            background: 'white',
                            color: '#374151',
                            cursor: 'pointer',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 10px center',
                            paddingRight: '32px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                          >
                            <option value="all">All Activity</option>
                            <option value="created">Created Requests</option>
                            <option value="fulfilled">Fulfilled Requests</option>
                            <option value="free">Made Free Requests</option>
                            <option value="none">No Request Activity</option>
                          </select>
                        </div>

                        {/* Submitted Requests Filter */}
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Submitted Requests</label>
                          <select value={submittedRequestsFilter} onChange={(e) => setSubmittedRequestsFilter(e.target.value)} style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #e5e7eb',
                            fontSize: '13px',
                            fontWeight: '500',
                            background: 'white',
                            color: '#374151',
                            cursor: 'pointer',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 10px center',
                            paddingRight: '32px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                          >
                            <option value="all">All Requests</option>
                            <option value="free">Free Requests Only</option>
                            <option value="paid">Paid Requests Only</option>
                            <option value="mixed">Both Free & Paid</option>
                          </select>
                        </div>

                        {/* Fulfilled Requests Filter */}
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fulfilled Requests</label>
                          <select value={fulfilledRequestsFilter} onChange={(e) => setFulfilledRequestsFilter(e.target.value)} style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #e5e7eb',
                            fontSize: '13px',
                            fontWeight: '500',
                            background: 'white',
                            color: '#374151',
                            cursor: 'pointer',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 10px center',
                            paddingRight: '32px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                          >
                            <option value="all">All Fulfillments</option>
                            <option value="free">Free Requests</option>
                            <option value="paid">Paid Requests</option>
                            <option value="mixed">Both Free & Paid</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 4: Number inputs */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Min Requests</label>
                          <input value={minRequestsFilter} onChange={(e) => setMinRequestsFilter(e.target.value)} placeholder="0" type="number" style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #e5e7eb',
                            fontSize: '13px',
                            fontWeight: '500',
                            background: 'white',
                            color: '#374151',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Min $/Request (Avg)</label>
                          <input value={minPerRequestFilter} onChange={(e) => setMinPerRequestFilter(e.target.value)} placeholder="0" type="number" style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #e5e7eb',
                            fontSize: '13px',
                            fontWeight: '500',
                            background: 'white',
                            color: '#374151',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Max $/Request (Avg)</label>
                          <input value={maxAvgRequestAmount} onChange={(e) => setMaxAvgRequestAmount(e.target.value)} placeholder="Any" type="number" style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #e5e7eb',
                            fontSize: '13px',
                            fontWeight: '500',
                            background: 'white',
                            color: '#374151',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Days Active (max)</label>
                          <input value={daysActiveFilter} onChange={(e) => setDaysActiveFilter(e.target.value)} placeholder="30" type="number" style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #e5e7eb',
                            fontSize: '13px',
                            fontWeight: '500',
                            background: 'white',
                            color: '#374151',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setCreatorOnlyFilter(false);
                          setUsersOnlyFilter(false);
                          setCategoryFilter('all');
                          setPlanFilter('all');
                          setRequestActivityFilter('all');
                          setSubmittedRequestsFilter('all');
                          setFulfilledRequestsFilter('all');
                          setMinRequestsFilter('');
                          setMinPerRequestFilter('');
                          setMaxAvgRequestAmount('');
                          setDaysActiveFilter('');
                          setPromotionSearch('');
                        }}
                        style={{
                          padding: '10px 16px',
                          fontSize: '13px',
                          fontWeight: '600',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.3)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)'; }}
                      >
                        Reset All Filters
                      </button>
                    </div>
                  )}
                </div>
                <div style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  maxHeight: '250px',
                  overflowY: 'auto',
                  backgroundColor: '#f9fafb'
                }}>
                  {promotionModal.recipientType === 'all' ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>All users will receive this promotion</div>
                  ) : filteredUsersForPromotion.length === 0 ? (
                    <div style={{
                      padding: '16px',
                      textAlign: 'center',
                      color: '#9ca3af',
                      fontSize: '13px'
                    }}>
                      {users.length === 0 ? 'No users available' : 'No users match filters'}
                    </div>
                  ) : (
                    filteredUsersForPromotion.map((user) => (
                      <div
                        key={user.id}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: 'pointer',
                          backgroundColor: promotionModal.selectedUsers.includes(user.id) ? '#dbeafe' : 'transparent',
                          transition: 'background-color 0.2s'
                        }}
                        onClick={() => {
                          const isSelected = promotionModal.selectedUsers.includes(user.id);
                          setPromotionModal({
                            ...promotionModal,
                            selectedUsers: isSelected
                              ? promotionModal.selectedUsers.filter(id => id !== user.id)
                              : [...promotionModal.selectedUsers, user.id]
                          });
                        }}
                        onMouseEnter={(e) => {
                          if (!promotionModal.selectedUsers.includes(user.id)) {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!promotionModal.selectedUsers.includes(user.id)) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={promotionModal.selectedUsers.includes(user.id)}
                          onChange={() => {}}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            accentColor: '#3b82f6'
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <p style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            margin: '0',
                            color: '#1f2937'
                          }}>
                            {user.name}
                          </p>
                          <p style={{
                            fontSize: '12px',
                            margin: '2px 0 0 0',
                            color: '#666'
                          }}>
                            {user.email}
                          </p>
                          {userMetrics[user.id] && (
                            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                              {userMetrics[user.id].hasPlan && (
                                <span style={{ fontSize: '10px', backgroundColor: '#dbeafe', color: '#0369a1', padding: '2px 6px', borderRadius: '3px' }}>
                                  💳 Has Plan
                                </span>
                              )}
                              {userMetrics[user.id].createdRequestsCount > 0 && (
                                <span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '3px' }}>
                                  📋 {userMetrics[user.id].createdRequestsCount} Created
                                </span>
                              )}
                              {userMetrics[user.id].fulfilledRequestsCount > 0 && (
                                <span style={{ fontSize: '10px', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '3px' }}>
                                  ✅ {userMetrics[user.id].fulfilledRequestsCount} Fulfilled
                                </span>
                              )}
                              {userMetrics[user.id].freeRequestsCount > 0 && (
                                <span style={{ fontSize: '10px', backgroundColor: '#fce7f3', color: '#831843', padding: '2px 6px', borderRadius: '3px' }}>
                                  🎁 {userMetrics[user.id].freeRequestsCount} Free
                                </span>
                              )}
                              {userMetrics[user.id].daysSinceLastActivity <= 7 && (
                                <span style={{ fontSize: '10px', backgroundColor: '#d1d5db', color: '#111', padding: '2px 6px', borderRadius: '3px' }}>
                                  🔥 Active
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {user.isCreator && (
                          <span style={{
                            fontSize: '11px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Crown size={12} /> Creator
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {promotionModal.selectedUsers.length > 0 && (
                  <p style={{
                    fontSize: '12px',
                    color: '#3b82f6',
                    margin: '8px 0 0 0',
                    fontWeight: '600'
                  }}>
                    ✓ {promotionModal.selectedUsers.length} user{promotionModal.selectedUsers.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}

            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            {/* CTA Customization */}
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937', display: 'block', marginBottom: '8px' }}>
                Customize Call-to-Action
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px', overflow: 'visible' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    value={promotionModal.ctaText}
                    onChange={(e) => setPromotionModal({ ...promotionModal, ctaText: e.target.value.slice(0, 30) })}
                    placeholder="e.g., Learn More"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  />
                  <input
                    value={promotionModal.ctaUrl}
                    onChange={(e) => setPromotionModal({ ...promotionModal, ctaUrl: e.target.value })}
                    placeholder="CTA URL/Link (e.g., https://example.com)"
                    type="url"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <button
                    type="button"
                    onClick={() => setCtaPickerOpen(!ctaPickerOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      background: 'white',
                      cursor: 'pointer',
                      minWidth: '72px',
                      maxWidth: '120px',
                      flex: '0 0 auto',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                  >
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>
                      {promotionModal.ctaIcon === 'gift' ? '🎁' :
                       promotionModal.ctaIcon === 'star' ? '⭐' :
                       promotionModal.ctaIcon === 'megaphone' ? '📢' :
                       promotionModal.ctaIcon === 'heart' ? '❤️' :
                       promotionModal.ctaIcon === 'fire' ? '🔥' :
                       promotionModal.ctaIcon === 'check' ? '✅' :
                       promotionModal.ctaIcon === 'arrow' ? '→' : '🎁'}
                    </span>
                    <span style={{ fontSize: '13px', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '64px', display: 'inline-block' }}>
                      {promotionModal.ctaIcon === 'gift' ? 'Gift' :
                       promotionModal.ctaIcon === 'star' ? 'Star' :
                       promotionModal.ctaIcon === 'megaphone' ? 'Megaphone' :
                       promotionModal.ctaIcon === 'heart' ? 'Heart' :
                       promotionModal.ctaIcon === 'fire' ? 'Fire' :
                       promotionModal.ctaIcon === 'check' ? 'Check' :
                       promotionModal.ctaIcon === 'arrow' ? 'Arrow' : 'Gift'}
                    </span>
                    <ChevronDown size={14} style={{ marginLeft: '4px', color: '#9ca3af' }} />
                  </button>

                  {ctaPickerOpen && (
                    <div style={{ position: 'absolute', right: 0, top: '44px', background: 'white', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.14)', padding: '8px', zIndex: 60, minWidth: '180px' }}>
                      {[
                        { value: 'gift', label: 'Gift', emoji: '🎁' },
                        { value: 'star', label: 'Star', emoji: '⭐' },
                        { value: 'megaphone', label: 'Megaphone', emoji: '📢' },
                        { value: 'heart', label: 'Heart', emoji: '❤️' },
                        { value: 'fire', label: 'Fire', emoji: '🔥' },
                        { value: 'check', label: 'Check', emoji: '✅' },
                        { value: 'arrow', label: 'Arrow', emoji: '→' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setPromotionModal({ ...promotionModal, ctaIcon: opt.value }); setCtaPickerOpen(false); }}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 10px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontSize: '16px' }}>{opt.emoji}</span>
                          <span style={{ fontSize: '14px', color: '#111' }}>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Promotion Preview */}
            {promotionModal.title && (
              <div style={{
                padding: '16px',
                backgroundColor: '#f9fafb',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', margin: '0', textTransform: 'uppercase' }}>Preview - How Users Will See It</p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setPromotionModal({ ...promotionModal, ctaColor: '#f59e0b' })}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#f59e0b',
                        border: promotionModal.ctaColor === '#f59e0b' ? '3px solid #1f2937' : '2px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Orange"
                    />
                    <button
                      onClick={() => setPromotionModal({ ...promotionModal, ctaColor: '#ef4444' })}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#ef4444',
                        border: promotionModal.ctaColor === '#ef4444' ? '3px solid #1f2937' : '2px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Red"
                    />
                    <button
                      onClick={() => setPromotionModal({ ...promotionModal, ctaColor: '#3b82f6' })}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                        border: promotionModal.ctaColor === '#3b82f6' ? '3px solid #1f2937' : '2px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Blue"
                    />
                    <button
                      onClick={() => setPromotionModal({ ...promotionModal, ctaColor: '#10b981' })}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        border: promotionModal.ctaColor === '#10b981' ? '3px solid #1f2937' : '2px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Green"
                    />
                    <button
                      onClick={() => setPromotionModal({ ...promotionModal, ctaColor: '#8b5cf6' })}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#8b5cf6',
                        border: promotionModal.ctaColor === '#8b5cf6' ? '3px solid #1f2937' : '2px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Purple"
                    />
                  </div>
                </div>
                
                {/* Notification Card Preview */}
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '28px 24px',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                  textAlign: 'center',
                  maxWidth: '440px',
                  width: '100%',
                  margin: '0 auto'
                }}>
                  {/* Icon Circle */}
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    backgroundColor: hexToRgba(promotionModal.ctaColor, 0.12),
                    fontSize: '32px'
                  }}>
                    {promotionModal.ctaIcon === 'gift' && '🎁'}
                    {promotionModal.ctaIcon === 'star' && '⭐'}
                    {promotionModal.ctaIcon === 'megaphone' && '📢'}
                    {promotionModal.ctaIcon === 'heart' && '❤️'}
                    {promotionModal.ctaIcon === 'fire' && '🔥'}
                    {promotionModal.ctaIcon === 'check' && '✅'}
                    {promotionModal.ctaIcon === 'arrow' && '→'}
                  </div>

                  {/* Header/Title */}
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    margin: '0 0 8px 0',
                    color: '#1f2937'
                  }}>
                    {promotionModal.promotionType === 'offer' && 'Special Offer'}
                    {promotionModal.promotionType === 'announcement' && 'Announcement'}
                    {promotionModal.promotionType === 'feature' && 'Featured Content'}
                  </h3>

                  {/* Subheader with recipient info */}
                  <p style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    margin: '0 0 16px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}>
                    {promotionModal.recipientType === 'all' && (
                      <>
                        <Megaphone size={14} /> For All Users
                      </>
                    )}
                    {promotionModal.recipientType === 'creators' && (
                      <>
                        <Crown size={14} /> For Creators
                      </>
                    )}
                    {promotionModal.recipientType === 'individual' && (
                      <>
                        <Users size={14} /> For {promotionModal.selectedUsers.length} user{promotionModal.selectedUsers.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </p>

                  {/* Main Title */}
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    margin: '0 0 12px 0',
                    color: '#1f2937',
                    wordBreak: 'break-word',
                    lineHeight: '1.4'
                  }}>
                    {promotionModal.title}
                  </h2>

                  {/* Message Text */}
                  <p style={{
                    fontSize: '14px',
                    color: '#4b5563',
                    margin: '0 0 20px 0',
                    lineHeight: '1.6',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {promotionModal.message}
                  </p>

                  {/* Action Button - Hyperlinked if URL provided */}
                  {promotionModal.ctaUrl ? (
                    <a
                      href={promotionModal.ctaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        width: '100%',
                        padding: '12px 24px',
                        backgroundColor: promotionModal.ctaColor,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        textDecoration: 'none',
                        textAlign: 'center',
                        opacity: 1
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      {promotionModal.ctaText}
                    </a>
                  ) : (
                    <button style={{
                      padding: '12px 24px',
                      backgroundColor: promotionModal.ctaColor,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '600',
                      width: '100%',
                      transition: 'all 0.2s',
                      opacity: 0.6
                    }}>
                      {promotionModal.ctaText}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* CTA buttons at bottom of modal */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={handleSendPromotion}
                draggable={false}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Send Promotion
              </button>
              <button
                onClick={() => setPromotionModal({ isOpen: false, title: '', message: '', recipientType: 'individual', selectedUsers: [], promotionType: 'offer', ctaText: 'Learn More', ctaIcon: 'gift', ctaColor: '#f59e0b', ctaUrl: '' })}
                draggable={false}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Overlay Ad Preview Modal */}
        {showOverlayPreview && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} onClick={() => setShowOverlayPreview(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <button onClick={() => setShowOverlayPreview(false)} style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top, 20px) + 14px)', right: 14, zIndex: 1420, background: 'rgba(255,255,255,0.04)', border: 'none', color: 'white', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', fontSize: 14, opacity: 0.95 }}>✕</button>

              {/* Video preview area */}
              <div style={{ position: 'absolute', top: 'env(safe-area-inset-top, 20px)', left: 0, right: 0, bottom: 'env(safe-area-inset-bottom, 20px)', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <div style={{ fontSize: 24, color: '#9ca3af' }}>Video Content Area</div>
                {/* Static placeholder ad card - full width */}
                <div style={{ position: 'absolute', width: '100%', height: 160, background: 'rgba(17,24,39,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, boxShadow: '0 12px 30px rgba(0,0,0,0.5)' }}>
                  <div style={{ width: '95%', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 10, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontWeight: 700, flexShrink: 0 }}>
                      {(bottomAdProfileName || '').charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{bottomAdProfileName || 'Advertiser'}</div>
                      <div style={{ fontSize: 13, color: '#e6eef8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bottomAdText || 'Your ad text goes here. Click to edit...'}</div>
                    </div>
                    <a href={bottomAdLink || '#'} target="_blank" rel="noreferrer" style={{ background: '#fff', color: '#111827', padding: '8px 12px', borderRadius: 8, textDecoration: 'none', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>Learn more</a>
                  </div>
                </div>
              </div>

              {/* Overlay ticker based on position */}
              {(overlayAdPosition === 'bottom' || overlayAdPosition === 'top') && (
                <div style={{
                  position: 'fixed',
                  [overlayAdPosition]: overlayAdPosition === 'top' ? 'env(safe-area-inset-top, 20px)' : 'env(safe-area-inset-bottom, 20px)',
                  left: 0,
                  right: 0,
                  background: overlayAdBgColor,
                  color: overlayAdTextColor,
                  padding: '14px 16px',
                  fontSize: 14,
                  fontWeight: 700,
                  zIndex: 1410,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  overflow: 'hidden'
                }}>
                  <div style={{ whiteSpace: 'nowrap', display: 'flex', gap: 32, animation: overlayAdTextItems.length > 0 ? `scroll ${overlayAdTextItems.reduce((acc, i) => acc + i.duration, 0) * 1.5}s linear infinite` : 'scroll 20s linear infinite' }}>
                    {overlayAdTextItems.length > 0 ? (
                      overlayAdTextItems.map((item) => (
                        <span key={item.id}>{overlayAdEmoji} {overlayAdCompanyName && `[${overlayAdCompanyName}]`} {item.text}</span>
                      ))
                    ) : (
                      <>
                        <span>{overlayAdEmoji} {overlayAdText}</span>
                        <span>{overlayAdEmoji} {overlayAdText}</span>
                        <span>{overlayAdEmoji} {overlayAdText}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {overlayAdPosition === 'fullscreen' && (
                <div style={{
                  position: 'fixed',
                  inset: 0,
                  background: overlayAdBgColor,
                  color: overlayAdTextColor,
                  zIndex: 1410,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 20,
                  padding: '40px',
                  paddingTop: 'calc(env(safe-area-inset-top, 20px) + 40px)',
                  paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 40px)',
                  textAlign: 'center'
                }}>
                  {/* Close Button */}
                  <button 
                    onClick={(e) => e.stopPropagation()} 
                    style={{
                      position: 'absolute',
                      top: 'calc(env(safe-area-inset-top, 20px) + 12px)',
                      right: 20,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      border: '2px solid rgba(255,255,255,0.4)',
                      color: '#fff',
                      fontSize: 20,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 51
                    }}
                  >
                    ✕
                  </button>
                  
                  {/* Profile Picture Area */}
                  <div style={{
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
                  }}>
                    {overlayProfileUrl ? (
                      <img src={overlayProfileUrl} alt="Company" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 40, opacity: 0.6 }}>📷</span>
                    )}
                  </div>
                  
                  {/* Text Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, maxWidth: '85%' }}>
                    {overlayAdTextItems.length > 0 ? overlayAdTextItems.map((item, idx) => (
                      <div key={idx} style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.3 }}>{item.text}</div>
                    )) : (
                      <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.3 }}>Sponsorship Message</div>
                    )}
                  </div>
                  
                  {/* Button */}
                  <button style={{ 
                    padding: '14px 40px', 
                    background: 'white', 
                    color: overlayAdBgColor, 
                    border: 'none', 
                    borderRadius: 8, 
                    fontSize: 16, 
                    fontWeight: 700, 
                    cursor: 'pointer', 
                    marginTop: 16,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}>{overlayBtnText || 'Learn More'}</button>
                </div>
              )}

              {overlayAdPosition === 'videoPlayer' && (
                <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1410, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 'env(safe-area-inset-top, 20px)', paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}>
                  <div style={{ flex: 1, width: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {/* AD Badge Preview */}
                    {overlayBadgeType !== 'none' && (
                      <div style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        zIndex: 601,
                        pointerEvents: 'none'
                      }}>
                        {overlayBadgeType === 'sponsoredBy' && overlayBadgeLogo ? (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: overlayBadgeColor || '#000',
                            padding: '6px 12px',
                            borderRadius: 6,
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 600,
                            opacity: 0.95
                          }}>
                            <span>Sponsored by</span>
                            <img src={overlayBadgeLogo} alt="sponsor" style={{
                              height: 20,
                              maxWidth: 80,
                              objectFit: 'contain'
                            }} />
                          </div>
                        ) : (
                          <div style={{
                            background: overlayBadgeColor || '#ff0000',
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
                    )}

                    {overlayVideoUrl ? (() => {
                      const isYT = (url) => url.includes('youtube.com') || url.includes('youtu.be');
                      const getYTId = (url) => {
                        let id = '';
                        if (url.includes('youtu.be/')) {
                          id = url.split('youtu.be/')[1].split('?')[0];
                        } else if (url.includes('youtube.com')) {
                          try { id = new URL(url).searchParams.get('v') || ''; } catch { }
                        }
                        return id;
                      };
                      const ytId = getYTId(overlayVideoUrl);
                      return isYT(overlayVideoUrl) && ytId ? (
                        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${ytId}?modestbranding=1&controls=1&fs=1&autoplay=1`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ background: '#000' }} />
                      ) : (
                        <video src={overlayVideoUrl} autoPlay style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
                      );
                    })() : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#1a1a1a' }}>
                        <div style={{ fontSize: 64, marginBottom: 16 }}>▶️</div>
                        <div style={{ fontSize: 16, lineHeight: 1.6, fontWeight: 600, color: '#fff' }}>
                          <div style={{ marginBottom: 8 }}>{overlayAdText || 'Advertisement'}</div>
                          <div style={{ fontSize: 13, opacity: 0.8 }}>{overlayBtnText || 'Watch Now'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  {((overlayCtaType === 'text' && overlayCtaText) || (overlayCtaType !== 'text' && overlayCtaMedia)) && (
                    <div style={{ width: '100%', padding: '12px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom, 12px) + 12px)', background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 24, color: overlayCtaColor || '#4B9EFF' }}>v</div>
                      {overlayCtaType === 'text' ? (
                        <button style={{ width: '100%', padding: '12px 16px', background: overlayCtaColor || '#4B9EFF', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{overlayCtaText}</button>
                      ) : overlayCtaType === 'image' ? (
                        <img src={overlayCtaMedia} alt="CTA" style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: 8 }} />
                      ) : overlayCtaType === 'gif' ? (
                        <img src={overlayCtaMedia} alt="CTA GIF" style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: 8 }} />
                      ) : overlayCtaType === 'video' ? (
                        <video src={overlayCtaMedia} autoPlay loop style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: 8, background: '#000' }} />
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {overlayAdPosition === 'videoOverlay' && (
                <div style={{
                  position: 'fixed',
                  bottom: 'calc(env(safe-area-inset-bottom, 20px) + 60px)',
                  left: 0,
                  right: 0,
                  zIndex: 1410,
                  height: 'auto',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  paddingLeft: 0,
                  paddingTop: overlayAdCompanyName ? '24px' : 0
                }}>
                  {/* Banner wrapper so tag aligns with banner left */}
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    {/* Company Name Tag - positioned relative to banner */}
                    {overlayAdCompanyName && (
                      <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '0px',
                        transform: 'translateY(6px)',
                        background: hexToRgba(overlayAdBgColor || '#E41E24', overlayTagOpacity != null ? overlayTagOpacity : 1),
                        color: overlayAdTextColor || '#ffffff',
                        padding: '6px 12px',
                        borderRadius: '6px 6px 0 0',
                        fontSize: '12px',
                        fontWeight: '900',
                        letterSpacing: '0.6px',
                        boxShadow: 'none',
                        whiteSpace: 'nowrap',
                        textTransform: 'uppercase',
                        border: '1px solid rgba(0,0,0,0.06)'
                      }}>
                        {overlayAdCompanyName}
                      </div>
                    )}

                    {/* Red Banner - Centered with Text */}
                    <div style={{
                      background: hexToRgba(overlayAdBgColor || '#dc2626', overlayAdOpacity != null ? overlayAdOpacity : 1),
                      padding: '12px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      boxShadow: overlayAdOpacity > 0.5 ? '0 6px 18px rgba(0,0,0,0.35)' : 'none',
                      borderRadius: '6px',
                      color: overlayAdTextColor || '#ffffff',
                      fontSize: '14px',
                      fontWeight: '700',
                      letterSpacing: '0.25px'
                    }}>
                      <div>
                        {overlayTextAnimation === 'marquee' && (
                          <div style={{
                            display: 'flex',
                            animation: 'marqueeScroll 14s linear infinite',
                            whiteSpace: 'nowrap'
                          }}>
                            {overlayAdTextItems && overlayAdTextItems.length > 0 ? (
                              overlayAdTextItems.map((it) => (
                                <span key={it.id} style={{ paddingRight: 32, display: 'inline-block' }}>{overlayAdEmoji} {it.text}</span>
                              ))
                            ) : (
                              <span style={{ display: 'inline-block' }}>{overlayAdEmoji} {overlayAdText || 'Your announcement here'}</span>
                            )}
                          </div>
                        )}
                        {overlayTextAnimation === 'fade' && (
                          <div style={{
                            animation: 'fadeInOut 6s ease-in-out infinite',
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            minWidth: '300px'
                          }}>
                            {overlayAdTextItems && overlayAdTextItems.length > 0 ? (
                              overlayAdTextItems[0] && <span>{overlayAdEmoji} {overlayAdTextItems[0].text}</span>
                            ) : (
                              <span>{overlayAdEmoji} {overlayAdText || 'Your announcement here'}</span>
                            )}
                          </div>
                        )}
                        {overlayTextAnimation === 'slide' && (
                          <div style={{
                            animation: 'slideInOut 8s ease-in-out infinite',
                            whiteSpace: 'nowrap',
                            minWidth: '300px',
                            textAlign: 'center'
                          }}>
                            {overlayAdTextItems && overlayAdTextItems.length > 0 ? (
                              overlayAdTextItems[0] && <span>{overlayAdEmoji} {overlayAdTextItems[0].text}</span>
                            ) : (
                              <span>{overlayAdEmoji} {overlayAdText || 'Your announcement here'}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <style>{`
                @keyframes marqueeScroll {
                  0% { 
                    transform: translateX(-100%);
                  }
                  100% { 
                    transform: translateX(100%);
                  }
                }
                @keyframes fadeInOut {
                  0%, 100% { opacity: 0; }
                  50% { opacity: 1; }
                }
                @keyframes slideInOut {
                  0%, 100% { transform: translateX(-100%); }
                  50% { transform: translateX(0); }
                }
                
                /* Mobile Responsive Template Cards */
                @media (max-width: 768px) {
                  .template-card {
                    flex-direction: column !important;
                  }
                  
                  .template-card-content {
                    flex-direction: column !important;
                    align-items: flex-start !important;
                  }
                  
                  .template-actions {
                    width: 100% !important;
                    flex-direction: row !important;
                    gap: 8px !important;
                    margin-top: 12px !important;
                  }
                  
                  .template-actions button {
                    flex: 1 !important;
                  }
                }
              `}</style>
            </div>
          </div>
        )}

        {/* Templates Modal (Saved bottom-ad templates) */}
        {showTemplatesModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowTemplatesModal(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: 720, maxWidth: '96%', maxHeight: '88vh', overflowY: 'auto', background: 'white', borderRadius: 16, padding: 0, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              {/* Header */}
              <div style={{ padding: '28px 32px', borderBottom: '1px solid #e5e7eb', background: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: 22, fontWeight: 700, color: '#111827' }}>Saved Templates</h2>
                    <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Manage your bottom ad templates</p>
                  </div>
                  <button onClick={() => setShowTemplatesModal(false)} style={{ padding: '8px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Close</button>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '24px 32px' }}>
                {(bottomAdTemplates || []).length === 0 ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 56, marginBottom: 12 }}>📋</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 6 }}>No templates yet</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>Create your first template to get started</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
                    {(bottomAdTemplates || []).map((t) => (
                      <div key={t.id} className="template-card" style={{ display: 'flex', gap: 16, padding: '18px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#ffffff', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        {/* Avatar */}
                        <div style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {t.avatar ? (
                            <img src={t.avatar} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ color: 'white', fontWeight: 700, fontSize: 28 }}>{(t.name||'A').charAt(0).toUpperCase()}</div>
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 6 }}>{t.name}</div>
                          {t.textItems && t.textItems.length > 0 ? (
                            <div style={{ color: '#6b7280', fontSize: 13, lineHeight: '1.5', marginBottom: 8 }}>
                              <strong>Text items ({t.textItems.length}):</strong>
                              <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
                                {t.textItems.slice(0, 3).map((item, i) => (
                                  <li key={i} style={{ fontSize: 12, color: '#6b7280' }}>{item}</li>
                                ))}
                                {t.textItems.length > 3 && <li style={{ fontSize: 12, color: '#9ca3af' }}>... and {t.textItems.length - 3} more</li>}
                              </ul>
                              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                                Interval: {t.textInterval}ms | Animation: {t.textAnimation} | Entry: {t.cardAnimation}
                              </div>
                            </div>
                          ) : (
                            <div style={{ color: '#6b7280', fontSize: 13, lineHeight: '1.5', marginBottom: 8 }}>{t.text}</div>
                          )}
                          {t.link && (
                            <div 
                              onClick={() => setExpandedTemplateUrls(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                              style={{ 
                                fontSize: 12, 
                                color: '#3b82f6', 
                                cursor: 'pointer',
                                maxWidth: '100%',
                                display: 'block',
                                wordBreak: expandedTemplateUrls[t.id] ? 'break-all' : 'keep-all',
                                whiteSpace: expandedTemplateUrls[t.id] ? 'normal' : 'nowrap',
                                overflow: 'hidden',
                                textOverflow: expandedTemplateUrls[t.id] ? 'clip' : 'ellipsis',
                                transition: 'all 0.2s',
                                borderRadius: 4,
                                padding: '2px 4px',
                                marginLeft: '-4px',
                              }}
                              title={t.link}
                            >
                              🔗 {t.link} {!expandedTemplateUrls[t.id] ? '...' : ''}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="template-actions" style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center', flexShrink: 0 }}>
                          <button onClick={() => applyTemplate(t)} style={{ padding: '10px 16px', borderRadius: 8, background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.2s', whiteSpace: 'nowrap' }}>✓ Apply</button>
                          <button onClick={() => setEditingBottomTemplate(t)} style={{ padding: '10px 16px', borderRadius: 8, background: '#f59e0b', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.2s', whiteSpace: 'nowrap' }}>✎ Edit</button>
                          <button onClick={() => { if (confirm('Delete this template?')) deleteBottomAdTemplate(t.id); }} style={{ padding: '10px 16px', borderRadius: 8, background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.2s', whiteSpace: 'nowrap' }}>🗑 Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {editingBottomTemplate && (
                <div style={{ marginTop: 24, padding: '24px', borderTop: '1px solid #e5e7eb', background: '#f9fafb', borderRadius: '0 0 16px 16px' }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 700, color: '#111827' }}>Edit Template</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div>
                      <label style={{ fontSize: 13, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 8 }}>Profile Name</label>
                      <input value={editingBottomTemplate.name} onChange={(e) => setEditingBottomTemplate({ ...editingBottomTemplate, name: e.target.value })} style={{ width: '100%', padding: '10px 12px', marginTop: 0, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 8 }}>Avatar URL</label>
                      <input value={editingBottomTemplate.avatar} onChange={(e) => setEditingBottomTemplate({ ...editingBottomTemplate, avatar: e.target.value })} style={{ width: '100%', padding: '10px 12px', marginTop: 0, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                    </div>
                    {editingBottomTemplate.textItems && editingBottomTemplate.textItems.length > 0 ? (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: 13, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 8 }}>Text Items</label>
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: 'white', maxHeight: '150px', overflowY: 'auto' }}>
                          {editingBottomTemplate.textItems.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: idx === editingBottomTemplate.textItems.length - 1 ? 0 : 8 }}>
                              <input 
                                value={item} 
                                onChange={(e) => {
                                  const updated = editingBottomTemplate.textItems.slice();
                                  updated[idx] = e.target.value;
                                  setEditingBottomTemplate({ ...editingBottomTemplate, textItems: updated });
                                }} 
                                placeholder={`Text item ${idx + 1}`}
                                style={{ flex: 1, padding: '6px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12 }}
                              />
                              <button 
                                onClick={() => {
                                  setEditingBottomTemplate({ ...editingBottomTemplate, textItems: editingBottomTemplate.textItems.filter((_, i) => i !== idx) });
                                }} 
                                style={{ padding: '4px 8px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        <button 
                          onClick={() => setEditingBottomTemplate({ ...editingBottomTemplate, textItems: [...(editingBottomTemplate.textItems || []), ''] })}
                          style={{ marginTop: 8, padding: '6px 12px', background: '#dbeafe', color: '#0369a1', border: '1px solid #7dd3fc', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                          + Add Text Item
                        </button>
                      </div>
                    ) : (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: 13, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 8 }}>Ad Text</label>
                        <textarea value={editingBottomTemplate.text} onChange={(e) => setEditingBottomTemplate({ ...editingBottomTemplate, text: e.target.value })} rows={3} style={{ width: '100%', padding: '10px 12px', marginTop: 0, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                      </div>
                    )}
                    <div>
                      <label style={{ fontSize: 13, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 8 }}>Text Interval (ms)</label>
                      <input type="number" value={editingBottomTemplate.textInterval || 5000} onChange={(e) => setEditingBottomTemplate({ ...editingBottomTemplate, textInterval: parseInt(e.target.value) || 5000 })} style={{ width: '100%', padding: '10px 12px', marginTop: 0, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 8 }}>Text Animation</label>
                      <BeautifulDropdown
                        value={editingBottomTemplate.textAnimation || 'fade'}
                        onChange={(val) => setEditingBottomTemplate({ ...editingBottomTemplate, textAnimation: val })}
                        options={[
                          { value: 'fade', label: 'Fade', icon: '✨', description: 'Smooth opacity transition' },
                          { value: 'slide-left', label: 'Slide Left', icon: '→', description: 'Text moves from right to left' },
                          { value: 'slide-right', label: 'Slide Right', icon: '←', description: 'Text moves from left to right' },
                          { value: 'bounce', label: 'Bounce', icon: '🎾', description: 'Spring-like bounce effect' },
                          { value: 'scale', label: 'Scale', icon: '📏', description: 'Size grows and shrinks' }
                        ]}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 8 }}>Card Animation</label>
                      <BeautifulDropdown
                        value={editingBottomTemplate.cardAnimation || 'fade'}
                        onChange={(val) => setEditingBottomTemplate({ ...editingBottomTemplate, cardAnimation: val })}
                        options={[
                          { value: 'fade', label: 'Fade', icon: '✨', description: 'Simple opacity fade-in' },
                          { value: 'line-first', label: 'Line First', icon: '━', description: 'Purple line appears first' },
                          { value: 'slide-down', label: 'Slide Down', icon: '⬇️', description: 'Comes from top of screen' },
                          { value: 'bounce-in', label: 'Bounce In', icon: '⏹️', description: 'Bouncy entrance animation' },
                          { value: 'scale-up', label: 'Scale Up', icon: '📏', description: 'Grows from center' }
                        ]}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 8 }}>Card Effect (After Entry)</label>
                      <BeautifulDropdown
                        value={editingBottomTemplate.cardEffect || 'none'}
                        onChange={(val) => setEditingBottomTemplate({ ...editingBottomTemplate, cardEffect: val })}
                        options={[
                          { value: 'none', label: 'None', icon: '⭕', description: 'No additional effect' },
                          { value: 'pulse', label: 'Pulse', icon: '💓', description: 'Subtle breathing effect' },
                          { value: 'shake', label: 'Shake', icon: '📳', description: 'Slight horizontal shaking' },
                          { value: 'glow', label: 'Glow', icon: '⚡', description: 'Purple glowing aura' },
                          { value: 'float', label: 'Float', icon: '🎈', description: 'Gentle up and down motion' },
                          { value: 'rotate', label: 'Rotate', icon: '🔄', description: 'Subtle rotating effect' }
                        ]}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 8 }}>Exit Animation</label>
                      <BeautifulDropdown
                        value={editingBottomTemplate.cardExitAnimation || 'fadeOut'}
                        onChange={(val) => setEditingBottomTemplate({ ...editingBottomTemplate, cardExitAnimation: val })}
                        options={[
                          { value: 'fadeOut', label: 'Fade Out', icon: '✨', description: 'Smooth opacity fade-out' },
                          { value: 'slideOut', label: 'Slide Out', icon: '→', description: 'Slides to the right' },
                          { value: 'scaleDown', label: 'Scale Down', icon: '📏', description: 'Shrinks and disappears' },
                          { value: 'bounceOut', label: 'Bounce Out', icon: '🎾', description: 'Bouncy exit animation' },
                          { value: 'rotateOut', label: 'Rotate Out', icon: '🔄', description: 'Rotates while fading' }
                        ]}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 8 }}>Border Color</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input 
                          type="color" 
                          value={editingBottomTemplate.borderColor || '#ff00ff'} 
                          onChange={(e) => setEditingBottomTemplate({ ...editingBottomTemplate, borderColor: e.target.value })}
                          style={{ width: 50, height: 50, borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' }}
                        />
                        <div style={{ fontSize: 12, color: '#6b7280', flex: 1 }}>
                          Customize the purple line color
                        </div>
                      </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: 13, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 8 }}>Target Link</label>
                      <input value={editingBottomTemplate.link} onChange={(e) => setEditingBottomTemplate({ ...editingBottomTemplate, link: e.target.value })} style={{ width: '100%', padding: '10px 12px', marginTop: 0, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button onClick={() => setEditingBottomTemplate(null)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => updateBottomAdTemplate(editingBottomTemplate.id, editingBottomTemplate)} style={{ padding: '10px 20px', borderRadius: 8, background: '#3b82f6', color: 'white', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Save Changes</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ad Management Modal - View and remove ads from a specific video */}
        {selectedVideoForAdMgmt && (() => {
          // Get latest video data from videos array
          const currentVideoData = videos.find(v => v.id === selectedVideoForAdMgmt.id) || selectedVideoForAdMgmt;
          return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedVideoForAdMgmt(null)}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', background: 'white', borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 700 }}>Manage Ads</h2>
                  <p style={{ margin: '0 0 20px 0', fontSize: 13, color: '#6b7280' }}>Video: <strong>{currentVideoData.title}</strong></p>
                </div>
                <button onClick={() => setSelectedVideoForAdMgmt(null)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Close</button>
              </div>
              
              {/* Bottom Ads Section */}
              <div style={{ marginBottom: 24, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: '0', fontSize: 15, fontWeight: 700, color: '#111827' }}>Bottom Ads ({currentVideoData.ads?.bottom?.length || 0})</h3>
                  {currentVideoData.ads?.bottom && currentVideoData.ads.bottom.length > 0 && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#ef4444' }}>
                      <input 
                        type="checkbox" 
                        onChange={() => handleRemoveAdsFromVideo(currentVideoData.id, 'bottom')}
                        style={{ cursor: 'pointer' }}
                      />
                      Remove All
                    </label>
                  )}
                </div>
                {currentVideoData.ads?.bottom && currentVideoData.ads.bottom.length > 0 ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                      {currentVideoData.ads.bottom.map((ad, idx) => (
                        <div key={ad.id || idx} style={{ padding: 10, background: 'white', borderRadius: 6, border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{ad.profileName || 'Unnamed Ad'}</div>
                            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                              Start: {ad.startTime}s | Duration: {ad.duration}s | Max Displays: {ad.displayCount || 'unlimited'}
                            </div>
                            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{ad.text}</div>
                          </div>
                          <button onClick={() => handleRemoveAdsFromVideo(currentVideoData.id, 'bottom', ad.id)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8 }}>Remove</button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: 12, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No bottom ads assigned</div>
                )}
              </div>

              {/* Overlay Ads Section */}
              <div style={{ marginBottom: 24, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: '0', fontSize: 15, fontWeight: 700, color: '#111827' }}>Overlay Ads ({currentVideoData.ads?.overlays?.length || 0})</h3>
                  {currentVideoData.ads?.overlays && currentVideoData.ads.overlays.length > 0 && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#ef4444' }}>
                      <input 
                        type="checkbox" 
                        onChange={() => handleRemoveAdsFromVideo(currentVideoData.id, 'overlay')}
                        style={{ cursor: 'pointer' }}
                      />
                      Remove All
                    </label>
                  )}
                </div>
                {currentVideoData.ads?.overlays && currentVideoData.ads.overlays.length > 0 ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                      {currentVideoData.ads.overlays.map((ad, idx) => (
                        <div key={ad.id || idx} style={{ padding: 10, background: 'white', borderRadius: 6, border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{ad.companyName || 'Unnamed Ad'}</div>
                            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                              Start: {ad.startTime}s | Duration: {ad.duration}s | Max Displays: {ad.displayCount || 'unlimited'}
                            </div>
                            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{ad.text}</div>
                          </div>
                          <button onClick={() => handleRemoveAdsFromVideo(currentVideoData.id, 'overlay', ad.id)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8 }}>Remove</button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: 12, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No overlay ads assigned</div>
                )}
              </div>
            </div>
          </div>
          );
        })()}


    <footer style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      borderTop: '1px solid #e5e7eb',
      background: 'white',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      gap: '8px',
      zIndex: 40,
      boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.08)',
      paddingTop: '10px',
      paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
      minHeight: '70px'
    }}>
      <button
        onClick={() => window.location.href = '/'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0',
          width: '50px',
          height: '50px',
          backgroundColor: 'transparent',
          color: '#4f46e5',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          flexDirection: 'column',
          gap: '4px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(79,70,229,0.1)';
          e.currentTarget.style.color = '#4338ca';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#4f46e5';
        }}
        title="Go to App"
      >
        <Home size={24} />
        <span>App</span>
      </button>
      <button
        onClick={() => setActiveTab('promotions')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0',
          width: '50px',
          height: '50px',
          backgroundColor: activeTab === 'promotions' ? 'rgba(245,158,11,0.1)' : 'transparent',
          color: activeTab === 'promotions' ? '#f59e0b' : '#6b7280',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: activeTab === 'promotions' ? '700' : '600',
          transition: 'all 0.3s ease',
          flexDirection: 'column',
          gap: '4px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(245,158,11,0.1)';
          e.currentTarget.style.color = '#f59e0b';
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'promotions') {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }
        }}
        title="Manage Promotions"
      >
        <Megaphone size={24} />
        <span>Promotions</span>
      </button>
      <button
        onClick={() => setActiveTab('templates')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0',
          width: '50px',
          height: '50px',
          backgroundColor: activeTab === 'templates' ? 'rgba(59,130,246,0.1)' : 'transparent',
          color: activeTab === 'templates' ? '#3b82f6' : '#6b7280',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: activeTab === 'templates' ? '700' : '600',
          transition: 'all 0.3s ease',
          flexDirection: 'column',
          gap: '4px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.1)';
          e.currentTarget.style.color = '#3b82f6';
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'templates') {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }
        }}
        title="Manage Overlay Templates"
      >
        <Copy size={24} />
        <span>Templates</span>
      </button>
      <button
        onClick={() => setActiveTab('ads')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0',
          width: '50px',
          height: '50px',
          backgroundColor: activeTab === 'ads' ? 'rgba(16,185,129,0.1)' : 'transparent',
          color: activeTab === 'ads' ? '#10b981' : '#6b7280',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: activeTab === 'ads' ? '700' : '600',
          transition: 'all 0.3s ease',
          flexDirection: 'column',
          gap: '4px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.1)';
          e.currentTarget.style.color = '#10b981';
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'ads') {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }
        }}
        title="Manage Ads"
      >
        <ImageIcon size={24} />
        <span>Ads</span>
      </button>
    </footer>
    
    {/* Fullscreen Overlay Preview Modal */}
    {showOverlayPreview && previewingOverlay && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: previewFullscreen ? '0' : (deviceOrientation === 'landscape' ? '20px' : '40px 20px')
      }}>
        {/* Header with close and maximize buttons */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 10000,
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => setPreviewFullscreen(!previewFullscreen)}
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid white',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              fontWeight: 'bold'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'scale(1)';
            }}
            title={previewFullscreen ? 'Exit fullscreen' : 'Fullscreen/Landscape'}
          >
            <Maximize2 size={20} />
          </button>
          <button
            onClick={() => setShowPreviewSaveModal(true)}
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid white',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              fontWeight: 'bold'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'scale(1)';
            }}
            title="Close preview (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Confirmation Message - Compact */}
        <div style={{
          position: 'absolute',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(16, 185, 129, 0.25)',
          border: '2px solid #10b981',
          borderRadius: '6px',
          padding: '8px 16px',
          color: '#10b981',
          fontSize: '13px',
          fontWeight: '600',
          textAlign: 'center',
          zIndex: 10001,
          animation: 'slideDown 0.3s ease',
          maxWidth: '80%',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <CheckCircle size={14} /> Overlay created
        </div>

        {/* Video container with responsive sizing */}
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: previewFullscreen ? '100vw' : (deviceOrientation === 'landscape' ? '95vw' : '100vw'),
          maxHeight: previewFullscreen ? '100vh' : (deviceOrientation === 'landscape' ? '90vh' : '100vh'),
          aspectRatio: previewFullscreen ? 'auto' : '16/9',
          position: 'relative',
          backgroundColor: '#1a1a1a',
          borderRadius: previewFullscreen ? '0px' : (deviceOrientation === 'landscape' ? '12px' : '0px')
        }} data-preview-video-container>
          {/* Main video/content */}
          {previewingOverlay.videoId && videos.find(v => v.id === previewingOverlay.videoId) && (
            <video
              src={videos.find(v => v.id === previewingOverlay.videoId)?.videoUrl}
              autoPlay
              controls
              data-preview-video-container
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                backgroundColor: '#000'
              }}
            />
          )}

          {/* Overlay on top - Draggable and Resizable */}
          <div
            data-preview-overlay
            style={{
              position: 'absolute',
              left: `${previewingOverlay.x}%`,
              top: `${previewingOverlay.y}%`,
              width: `${previewingOverlay.width}%`,
              height: `${previewingOverlay.height}%`,
              transform: 'translate(-50%, -50%)',
              cursor: 'grab',
              borderRadius: '8px',
              overflow: 'visible',
              pointerEvents: 'auto',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.2s ease',
              border: '2px solid rgba(245, 158, 11, 0.7)',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(245, 158, 11, 0.4)';
              e.currentTarget.style.border = '2px solid rgba(245, 158, 11, 0.9)';
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.dataset.dragging) {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
                e.currentTarget.style.border = '2px solid rgba(245, 158, 11, 0.7)';
              }
            }}
            onMouseDown={(e) => {
              // Only drag if not clicking on resize handle
              if (e.target.closest('[data-resize-handle]')) return;
              
              e.preventDefault();
              const containerRect = document.querySelector('[data-preview-video-container]')?.getBoundingClientRect();
              if (!containerRect) return;
              
              const startX = e.clientX;
              const startY = e.clientY;
              const startPosX = previewingOverlay.x;
              const startPosY = previewingOverlay.y;
              const overlayEl = e.currentTarget;
              overlayEl.dataset.dragging = 'true';
              overlayEl.style.cursor = 'grabbing';
              
              const handleMouseMove = (moveEvent) => {
                moveEvent.preventDefault();
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;
                const deltaXPercent = (deltaX / containerRect.width) * 100;
                const deltaYPercent = (deltaY / containerRect.height) * 100;
                
                const newX = Math.max(0, Math.min(100, startPosX + deltaXPercent));
                const newY = Math.max(0, Math.min(100, startPosY + deltaYPercent));
                
                setPreviewingOverlay(prev => ({
                  ...prev,
                  x: newX,
                  y: newY
                }));
              };
              
              const handleMouseUp = () => {
                overlayEl.dataset.dragging = 'false';
                overlayEl.style.cursor = 'grab';
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
            onPointerDown={(e) => {
              // pointer events fallback for better touch/mouse handling
              if (e.target.closest('[data-resize-handle]')) return;
              e.preventDefault();
              const containerRect = document.querySelector('[data-preview-video-container]')?.getBoundingClientRect();
              if (!containerRect) return;

              const startX = e.clientX;
              const startY = e.clientY;
              const startPosX = previewingOverlay.x;
              const startPosY = previewingOverlay.y;
              const overlayEl = e.currentTarget;
              overlayEl.setPointerCapture && overlayEl.setPointerCapture(e.pointerId);
              overlayEl.dataset.dragging = 'true';
              overlayEl.style.cursor = 'grabbing';
              let lastUpdate = 0;
              const throttleMs = 16; // ~60fps
              let pendingX = startPosX, pendingY = startPosY;

              const handlePointerMove = (moveEvent) => {
                moveEvent.preventDefault();
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;
                const deltaXPercent = (deltaX / containerRect.width) * 100;
                const deltaYPercent = (deltaY / containerRect.height) * 100;

                pendingX = Math.max(0, Math.min(100, startPosX + deltaXPercent));
                pendingY = Math.max(0, Math.min(100, startPosY + deltaYPercent));

                const now = performance.now();
                if (now - lastUpdate >= throttleMs) {
                  lastUpdate = now;
                  setPreviewingOverlay(prev => ({ ...prev, x: pendingX, y: pendingY }));
                }
              };

              const handlePointerUp = (upEvent) => {
                overlayEl.releasePointerCapture && overlayEl.releasePointerCapture(upEvent.pointerId);
                overlayEl.dataset.dragging = 'false';
                overlayEl.style.cursor = 'grab';
                setPreviewingOverlay(prev => ({ ...prev, x: pendingX, y: pendingY }));
                document.removeEventListener('pointermove', handlePointerMove);
                document.removeEventListener('pointerup', handlePointerUp);
              };

              document.addEventListener('pointermove', handlePointerMove);
              document.addEventListener('pointerup', handlePointerUp);
            }}
            onClick={() => {
              if (previewingOverlay.clickUrl) {
                window.open(previewingOverlay.clickUrl, '_blank');
              }
            }}
          >
            {/* Resize Handle - Bottom Right */}
            <div
              data-resize-handle
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const containerRect = document.querySelector('[data-preview-video-container]')?.getBoundingClientRect();
                if (!containerRect) return;
                
                const startX = e.clientX;
                const startY = e.clientY;
                const startWidth = previewingOverlay.width;
                const startHeight = previewingOverlay.height;
                
                const handleMouseMove = (moveEvent) => {
                  moveEvent.preventDefault();
                  const deltaX = moveEvent.clientX - startX;
                  const deltaY = moveEvent.clientY - startY;
                  const widthPercent = (deltaX / containerRect.width) * 100;
                  const heightPercent = (deltaY / containerRect.height) * 100;
                  
                  setPreviewingOverlay(prev => ({
                    ...prev,
                    width: Math.max(5, startWidth + widthPercent),
                    height: Math.max(5, startHeight + heightPercent)
                  }));
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const containerRect = document.querySelector('[data-preview-video-container]')?.getBoundingClientRect();
                if (!containerRect || !e.touches || !e.touches[0]) return;

                const startX = e.touches[0].clientX;
                const startY = e.touches[0].clientY;
                const startWidth = previewingOverlay.width;
                const startHeight = previewingOverlay.height;

                const handleTouchMove = (moveEvent) => {
                  if (!moveEvent.touches || !moveEvent.touches[0]) return;
                  moveEvent.preventDefault();
                  const deltaX = moveEvent.touches[0].clientX - startX;
                  const deltaY = moveEvent.touches[0].clientY - startY;
                  const widthPercent = (deltaX / containerRect.width) * 100;
                  const heightPercent = (deltaY / containerRect.height) * 100;

                  setPreviewingOverlay(prev => ({
                    ...prev,
                    width: Math.max(5, startWidth + widthPercent),
                    height: Math.max(5, startHeight + heightPercent)
                  }));
                };

                const handleTouchEnd = () => {
                  document.removeEventListener('touchmove', handleTouchMove);
                  document.removeEventListener('touchend', handleTouchEnd);
                };

                document.addEventListener('touchmove', handleTouchMove, { passive: false });
                document.addEventListener('touchend', handleTouchEnd);
              }}
              style={{
                position: 'absolute',
                bottom: '-6px',
                right: '-6px',
                width: '20px',
                height: '20px',
                backgroundColor: '#3b82f6',
                cursor: 'nwse-resize',
                borderRadius: '2px',
                zIndex: 30,
                pointerEvents: 'auto',
                border: '2px solid white',
                boxShadow: '0 0 6px rgba(59, 130, 246, 0.6)'
              }}
              title="Drag to resize"
            />

            {previewingOverlay.assetType === 'image' ? (
              <img
                src={previewingOverlay.assetUrl}
                alt="Ad Overlay"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  pointerEvents: 'none'
                }}
              />
            ) : previewingOverlay.assetType === 'video' ? (
              <video
                src={previewingOverlay.assetUrl}
                autoPlay
                loop
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  pointerEvents: 'none'
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: previewingOverlay.color || previewingOverlay.overlayBgColor || '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: previewingOverlay.overlayColor || 'white',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  padding: '16px',
                  textAlign: 'center',
                  overflow: 'hidden',
                  wordWrap: 'break-word',
                  pointerEvents: 'none'
                }}
              >
                {previewingOverlay.text}
              </div>
            )}
          </div>
        </div>

        {/* Info and controls at bottom */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
          color: 'white',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <button
              onClick={() => setShowPreviewSaveModal(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1f2937',
                color: 'white',
                border: '2px solid #4b5563',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#374151';
                e.target.style.borderColor = '#6b7280';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#1f2937';
                e.target.style.borderColor = '#4b5563';
              }}
            >
              Close Preview
            </button>
          </div>
          <p style={{ margin: '0 0 8px 0', opacity: 0.8 }}>
            {previewingOverlay.assetType === 'image' && '📸 Image Overlay'}
            {previewingOverlay.assetType === 'video' && '🎬 Video Overlay'}
            {previewingOverlay.assetType === 'text' && '📝 Text Overlay'}
            {previewingOverlay.clickUrl && ' • 🔗 Clickable'}
            {previewingOverlay.duration && ` • Duration: ${previewingOverlay.duration}s`}
          </p>
          <p style={{ margin: '0', fontSize: '12px', opacity: 0.6 }}>
            {deviceOrientation === 'landscape' ? '📱 Landscape Mode' : '📱 Portrait Mode'} • This is how the ad will appear to users
          </p>
        </div>

        {/* Save / Apply Modal shown when closing preview */}
        {showPreviewSaveModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '420px', background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}>
              <h3 style={{ margin: '0 0 8px 0' }}>Save changes?</h3>
              <p style={{ margin: '0 0 12px 0', color: '#374151' }}>You can continue editing or save this overlay and apply it to the current video (and save as a reusable template).</p>
              <div style={{ marginBottom: '10px' }}>
                <input placeholder="Template name (optional)" value={templateName} onChange={(e) => setTemplateName(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowPreviewSaveModal(false); setShowOverlayPreview(false); }} style={{ padding: '8px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}>Continue Editing</button>
                <button onClick={() => saveAndApplyPreview(true)} style={{ padding: '8px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Save and Apply</button>
              </div>
            </div>
          </div>
        )}

        {/* My Profile Tab */}
        {activeTab === 'myProfile' && staffSession && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '32px',
              gap: '16px'
            }}>
              <button
                onClick={() => setActiveTab('videos')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#eff6ff'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                ← Back to Dashboard
              </button>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>My Profile</h1>
            </div>

            {/* Profile Card */}
            <div style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              {!myProfileEdit.isEditing ? (
                <>
                  {/* View Mode */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee ID</label>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#111827',
                        padding: '8px 0'
                      }}>{staffSession.id || 'N/A'}</div>
                    </div>

                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</label>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#111827',
                        padding: '8px 0'
                      }}>{staffSession.name || 'Not set'}</div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#111827',
                        padding: '8px 0'
                      }}>{staffSession.email || 'Not set'}</div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</label>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#111827',
                        padding: '8px 0',
                        textTransform: 'capitalize'
                      }}>{staffSession.role || 'Staff'}</div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Permissions</label>
                      <div style={{
                        padding: '12px 16px',
                        background: '#f0f9ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#1e40af'
                      }}>
                        {Object.entries(staffSession?.permissions || {}).filter(([_, value]) => value).length > 0 ? (
                          Object.entries(staffSession?.permissions || {}).map(([key, value]) => 
                            value && <div key={key} style={{ padding: '4px 0' }}>✓ {key.replace(/_/g, ' ')}</div>
                          )
                        ) : (
                          <div>No specific permissions assigned</div>
                        )}
                        {staffSession?.isAdmin && <div style={{ padding: '4px 0', fontWeight: '600' }}>✓ ADMIN ACCESS</div>}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                      <button
                        onClick={handleEditMyProfile}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.2)';
                        }}
                      >
                        Edit Profile
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Edit Mode */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</label>
                      <input
                        type="text"
                        value={myProfileEdit.name}
                        onChange={(e) => setMyProfileEdit({ ...myProfileEdit, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
                      <input
                        type="email"
                        value={myProfileEdit.email}
                        onChange={(e) => setMyProfileEdit({ ...myProfileEdit, email: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                      />
                    </div>

                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                      <div style={{
                        padding: '12px 16px',
                        background: '#f3f4f6',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => setMyProfileEdit({ ...myProfileEdit, showPasswordChange: !myProfileEdit.showPasswordChange })}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                      >
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {myProfileEdit.showPasswordChange ? '▼' : '▶'} Change Password
                        </div>
                      </div>

                      {myProfileEdit.showPasswordChange && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                          <input
                            type="password"
                            placeholder="New Password"
                            value={myProfileEdit.newPassword}
                            onChange={(e) => setMyProfileEdit({ ...myProfileEdit, newPassword: e.target.value })}
                            style={{
                              padding: '10px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontFamily: 'inherit',
                              transition: 'all 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                          />
                          <input
                            type="password"
                            placeholder="Confirm Password"
                            value={myProfileEdit.confirmPassword}
                            onChange={(e) => setMyProfileEdit({ ...myProfileEdit, confirmPassword: e.target.value })}
                            style={{
                              padding: '10px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontFamily: 'inherit',
                              transition: 'all 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                          />
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          background: 'transparent',
                          color: '#6b7280',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#f3f4f6';
                          e.target.style.borderColor = '#9ca3af';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.borderColor = '#d1d5db';
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveMyProfile}
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.2)';
                        }}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '16px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 2001,
            backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            animation: 'slideIn 0.3s ease-out'
          }}>
            {toast.message}
          </div>
        )}

        {/* Approval Modal - Outside main container */}
        {approvalInstructionsModal.isOpen && approvalInstructionsModal.account && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
        }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
            Approve Account & Set Instructions
          </h2>
          <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>
            {approvalInstructionsModal.account.name} ({approvalInstructionsModal.account.email})
          </p>

          {/* Admin Access Option */}
          <div style={{
            padding: '12px',
            marginBottom: '16px',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fee2e2'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
              <input
                type="checkbox"
                checked={approvalInstructionsModal.grantAdmin}
                onChange={(e) => setApprovalInstructionsModal(prev => ({ ...prev, grantAdmin: e.target.checked }))}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <span style={{ fontWeight: '600', color: '#991b1b' }}>
                ⭐ Grant Administrator Access
              </span>
            </label>
            <p style={{ margin: '4px 0 0 24px', fontSize: '12px', color: '#7f1d1d' }}>
              Allows approval of other accounts and full system access
            </p>
          </div>

          {/* Permissions Section */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
                Access Permissions
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setAllPermissions(true)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: '#e0e7ff',
                    color: '#4f46e5',
                    border: '1px solid #c7d2fe',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => setAllPermissions(false)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  None
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {Object.entries(approvalInstructionsModal.permissions || {}).map(([permission, isEnabled]) => (
                <label key={permission} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px' }}>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => setApprovalInstructionsModal(prev => ({
                      ...prev,
                      permissions: { ...prev.permissions, [permission]: !isEnabled }
                    }))}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '13px', color: '#374151' }}>
                    {permission.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Instructions Section */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
              📋 Custom Instructions (Optional)
            </label>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280' }}>
              Add custom instructions or welcome message to display when the user logs in
            </p>
            <textarea
              value={approvalInstructionsModal.instructions}
              onChange={(e) => setApprovalInstructionsModal(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="e.g., Welcome to the team! Here are your first steps..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontFamily: 'inherit',
                fontSize: '13px',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              onClick={() => setApprovalInstructionsModal({ isOpen: false, account: null, permissions: {}, grantAdmin: false, instructions: '' })}
              style={{
                padding: '10px 16px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmApproval}
              style={{
                padding: '10px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Approve Account
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Deny Account Modal - Outside main container */}
    {denyModal.isOpen && denyModal.account && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
        }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
            Deny Account
          </h2>
          <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>
            {denyModal.account.name} ({denyModal.account.email})
          </p>

          {/* Preset Denial Reasons */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
              📌 Quick Reasons
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {[
                'Insufficient information',
                'Policy violation',
                'Account verification failed',
                'Suspicious activity',
                'Duplicate account',
                'Incomplete application'
              ].map(reason => (
                <button
                  key={reason}
                  onClick={() => setDenyModal(prev => ({ ...prev, selectedReason: reason }))}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: denyModal.selectedReason === reason ? '#ef4444' : '#f3f4f6',
                    color: denyModal.selectedReason === reason ? 'white' : '#374151',
                    border: `1px solid ${denyModal.selectedReason === reason ? '#dc2626' : '#d1d5db'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (denyModal.selectedReason !== reason) {
                      e.target.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (denyModal.selectedReason !== reason) {
                      e.target.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
              💬 Custom Denial Message (Optional)
            </label>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280' }}>
              Leave empty to use the selected reason above, or customize the message below
            </p>
            <textarea
              value={denyModal.customMessage}
              onChange={(e) => setDenyModal(prev => ({ ...prev, customMessage: e.target.value }))}
              placeholder="Explain why the account was denied (optional)..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontFamily: 'inherit',
                fontSize: '13px',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              onClick={() => setDenyModal({ isOpen: false, account: null, selectedReason: '', customMessage: '' })}
              style={{
                padding: '10px 16px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDenial}
              style={{
                padding: '10px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Deny Account
            </button>
          </div>
        </div>
      </div>
    )}
        
        <style>{`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(400px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </div>
    )}

    {/* Staff Permissions Modal - OUTSIDE overlay preview */}
    {staffPermissionsModal.isOpen && staffPermissionsModal.member && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
        }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
            Manage Staff Permissions
          </h2>
          <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>
            {staffPermissionsModal.member.name} ({staffPermissionsModal.member.email})
          </p>

          {/* Block User Section */}
          <div style={{
            padding: '16px',
            marginBottom: '16px',
            borderRadius: '8px',
            backgroundColor: staffPermissionsModal.blocked ? '#fef2f2' : '#f9fafb',
            border: `1px solid ${staffPermissionsModal.blocked ? '#fecaca' : '#e5e7eb'}`
          }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '12px' }}>
              <div 
                onClick={() => setStaffPermissionsModal(prev => ({ ...prev, blocked: !prev.blocked }))}
                style={{
                  position: 'relative',
                  width: '48px',
                  height: '26px',
                  backgroundColor: staffPermissionsModal.blocked ? '#ef4444' : '#d1d5db',
                  borderRadius: '13px',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '3px',
                  left: staffPermissionsModal.blocked ? '25px' : '3px',
                  width: '20px',
                  height: '20px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              </div>
              <div>
                <span style={{ display: 'block', fontWeight: 'bold', color: staffPermissionsModal.blocked ? '#dc2626' : '#374151', fontSize: '14px' }}>
                  🚫 Block User Account
                </span>
                <span style={{ display: 'block', fontSize: '12px', color: staffPermissionsModal.blocked ? '#b91c1c' : '#6b7280' }}>
                  {staffPermissionsModal.blocked ? 'User will see a blocked message on login' : 'Prevent this user from logging in'}
                </span>
              </div>
            </label>
          </div>

          {/* Admin Access Option */}
          <div style={{
            padding: '12px',
            marginBottom: '16px',
            borderRadius: '8px',
            backgroundColor: '#fff7ed',
            border: '1px solid #ffedd5'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
              <input
                type="checkbox"
                checked={staffPermissionsModal.grantAdmin}
                onChange={(e) => setStaffPermissionsModal(prev => ({ ...prev, grantAdmin: e.target.checked }))}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <span style={{ fontWeight: '600', color: '#9a3412' }}>
                ⭐ Grant Approval Authority
              </span>
            </label>
            <p style={{ margin: '4px 0 0 24px', fontSize: '12px', color: '#c2410c' }}>
              Allows this user to approve new accounts and manage other staff
            </p>
          </div>

          {/* Permissions Section */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
                Access Permissions
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    const allEnabled = {};
                    Object.keys(ALL_PERMISSIONS).forEach(k => {
                      allEnabled[k] = true;
                    });
                    setStaffPermissionsModal(prev => ({ ...prev, permissions: allEnabled }));
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: '#e0e7ff',
                    color: '#4f46e5',
                    border: '1px solid #c7d2fe',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => {
                    const allDisabled = {};
                    Object.keys(ALL_PERMISSIONS).forEach(k => {
                      allDisabled[k] = false;
                    });
                    setStaffPermissionsModal(prev => ({ ...prev, permissions: allDisabled }));
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  None
                </button>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              {Object.entries(ALL_PERMISSIONS).map(([permKey, permLabel]) => {
                const isEnabled = staffPermissionsModal.permissions[permKey] !== false;
                return (
                <label
                  key={permKey}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    backgroundColor: isEnabled ? '#dbeafe' : '#fef2f2',
                    border: `1px solid ${isEnabled ? '#93c5fd' : '#fecaca'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => {
                      setStaffPermissionsModal(prev => ({
                        ...prev,
                        permissions: {
                          ...prev.permissions,
                          [permKey]: !isEnabled
                        }
                      }));
                    }}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '500', color: isEnabled ? '#374151' : '#dc2626' }}>
                    {permLabel}
                  </span>
                </label>
              );})}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              onClick={() => setStaffPermissionsModal({ isOpen: false, member: null, permissions: {}, grantAdmin: false, blocked: false })}
              style={{
                padding: '10px 16px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`${getStaffBackendBaseUrl()}/staff/update-permissions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      employeeId: staffSession.id,
                      targetEmployeeId: staffPermissionsModal.member.id,
                      permissions: staffPermissionsModal.permissions,
                      grantAdminAccess: staffPermissionsModal.grantAdmin,
                      blocked: staffPermissionsModal.blocked
                    })
                  });

                  if (res.ok) {
                    const memberName = staffPermissionsModal.member.name;
                    const wasBlocked = staffPermissionsModal.blocked;
                    setStaffPermissionsModal({ isOpen: false, member: null, permissions: {}, grantAdmin: false, blocked: false });
                    setToast({ 
                      type: wasBlocked ? 'warning' : 'success', 
                      message: wasBlocked 
                        ? `${memberName} has been blocked. They will see a blocked message on login.` 
                        : `Permissions updated for ${memberName}` 
                    });
                    // Reload staff members list
                    const staffRes = await fetch(`${getStaffBackendBaseUrl()}/staff/all?employeeId=${staffSession.id}`);
                    if (staffRes.ok) {
                      const data = await staffRes.json();
                      setStaffMembers(data.members || []);
                    }
                  } else {
                    setToast({ type: 'error', message: 'Failed to update permissions' });
                  }
                } catch (err) {
                  console.error('Update permissions failed:', err);
                  setToast({ type: 'error', message: 'Error updating permissions' });
                }
              }}
              style={{
                padding: '10px 16px',
                backgroundColor: staffPermissionsModal.blocked ? '#ef4444' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {staffPermissionsModal.blocked ? '🚫 Block & Save' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Staff Profile Modal - OUTSIDE overlay preview */}
    {staffProfileModal.isOpen && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
        }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
            👤 My Profile
          </h2>
          <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>
            Manage your account settings and permissions
          </p>

          {/* Account Information */}
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
              Account Information
            </h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>
                Employee ID
              </label>
              <div style={{ padding: '10px 12px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                {staffSession?.id}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>
                Role
              </label>
              <div style={{ padding: '10px 12px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                {staffSession?.role === 'administrator' ? '⭐ Administrator' : '👤 Moderator'}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>
                Name
              </label>
              <input
                type="text"
                value={staffProfileModal.name}
                onChange={(e) => setStaffProfileModal(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>
                Email
              </label>
              <input
                type="email"
                value={staffProfileModal.email}
                onChange={(e) => setStaffProfileModal(prev => ({ ...prev, email: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Password Section */}
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <button
              onClick={() => setStaffProfileModal(prev => ({ ...prev, showPasswordChange: !prev.showPasswordChange }))}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              🔑 Manage Passwords
              <span>{staffProfileModal.showPasswordChange ? '▼' : '▶'}</span>
            </button>

            {staffProfileModal.showPasswordChange && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Current Passwords Display */}
                <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #93c5fd' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 'bold', color: '#1e40af' }}>
                    📋 YOUR CURRENT PASSWORDS
                  </h4>
                  
                  {[0, 1, 2].map((idx) => (
                    <div key={`current-${idx}`} style={{ marginBottom: idx < 2 ? '12px' : '0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151', minWidth: '70px' }}>
                          Password {idx + 1}:
                        </span>
                        <div style={{
                          flex: 1,
                          padding: '8px 12px',
                          backgroundColor: 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px',
                          color: '#4b5563',
                          fontFamily: 'monospace',
                          wordBreak: 'break-all'
                        }}>
                          {staffProfileModal[`showCurrentPassword${idx + 1}`] ? staffProfileModal.currentPasswords[idx] || '(Not set)' : '••••••••'}
                        </div>
                        <button
                          onClick={() => setStaffProfileModal(prev => ({
                            ...prev,
                            [`showCurrentPassword${idx + 1}`]: !prev[`showCurrentPassword${idx + 1}`]
                          }))}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#e0e7ff',
                            color: '#4f46e5',
                            border: '1px solid #c7d2fe',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {staffProfileModal[`showCurrentPassword${idx + 1}`] ? '👁️ Hide' : '👁️ Show'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* New Passwords Input */}
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 'bold', color: '#374151' }}>
                    ✏️ UPDATE PASSWORDS (Optional - leave blank to keep current)
                  </h4>
                  
                  {[1, 2, 3].map((num) => (
                    <div key={`new-${num}`} style={{ marginBottom: num < 3 ? '12px' : '0' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>
                        New Password {num}
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type={staffProfileModal[`showPassword${num}`] ? 'text' : 'password'}
                          value={staffProfileModal[`newPassword${num}`]}
                          onChange={(e) => setStaffProfileModal(prev => ({ ...prev, [`newPassword${num}`]: e.target.value }))}
                          placeholder={`Enter new password ${num}`}
                          style={{
                            flex: 1,
                            padding: '10px 12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                        <button
                          onClick={() => setStaffProfileModal(prev => ({
                            ...prev,
                            [`showPassword${num}`]: !prev[`showPassword${num}`]
                          }))}
                          style={{
                            padding: '10px 12px',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#374151',
                            minWidth: '45px'
                          }}
                        >
                          {staffProfileModal[`showPassword${num}`] ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setStaffProfileModal({ 
                isOpen: false, 
                showPasswordChange: false, 
                name: '', 
                email: '', 
                currentPasswords: ['', '', ''],
                newPassword1: '',
                newPassword2: '',
                newPassword3: '',
                showPassword1: false,
                showPassword2: false,
                showPassword3: false,
                showCurrentPassword1: false,
                showCurrentPassword2: false,
                showCurrentPassword3: false
              })}
              style={{
                padding: '10px 16px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  // Prepare passwords array - only send if new password is provided
                  const passwords = [];
                  if (staffProfileModal.newPassword1) passwords.push(staffProfileModal.newPassword1);
                  if (staffProfileModal.newPassword2) passwords.push(staffProfileModal.newPassword2);
                  if (staffProfileModal.newPassword3) passwords.push(staffProfileModal.newPassword3);

                  const res = await fetch(`${getStaffBackendBaseUrl()}/staff/update-profile`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      employeeId: staffSession.id,
                      name: staffProfileModal.name,
                      email: staffProfileModal.email,
                      passwords: passwords.length > 0 ? passwords : undefined
                    })
                  });

                  if (res.ok) {
                    const data = await res.json();
                    setStaffSession(data.employee);
                    setStaffProfileModal({ 
                      isOpen: false, 
                      showPasswordChange: false, 
                      name: '', 
                      email: '', 
                      currentPasswords: data.employee.passwords || ['', '', ''],
                      newPassword1: '',
                      newPassword2: '',
                      newPassword3: '',
                      showPassword1: false,
                      showPassword2: false,
                      showPassword3: false,
                      showCurrentPassword1: false,
                      showCurrentPassword2: false,
                      showCurrentPassword3: false
                    });
                    setToast({ type: 'success', message: 'Profile updated successfully' });
                  } else {
                    setToast({ type: 'error', message: 'Failed to update profile' });
                  }
                } catch (err) {
                  console.error('Update profile failed:', err);
                  setToast({ type: 'error', message: 'Error updating profile' });
                }
              }}
              style={{
                padding: '10px 16px',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Access Denied Modal */}
    {accessDeniedModal.isOpen && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            backgroundColor: '#fef2f2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '32px' }}>🚫</span>
          </div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>
            Access Denied
          </h2>
          <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px', lineHeight: '1.5' }}>
            You don't have the clearance to access <strong style={{ color: '#374151' }}>{accessDeniedModal.pageName}</strong>.
            <br /><br />
            Contact your administrator to request access.
          </p>
          <button
            onClick={() => setAccessDeniedModal({ isOpen: false, pageName: '' })}
            style={{
              padding: '12px 24px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              width: '100%'
            }}
          >
            OK, Got It
          </button>
        </div>
      </div>
    )}
    </>
  );
}