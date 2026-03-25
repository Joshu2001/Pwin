/* eslint-disable no-empty */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, CheckCircle, Rocket, Trophy, ChevronLeft, Settings, ChevronRight, MessageSquare, PlayCircle, Star, CornerUpRight, Send, X, Lightbulb, Trash2, Archive, Filter } from 'lucide-react';
import { translations, getTranslation } from './translations.js';
import { resolveMediaUrl } from './utils/media.js';
import { useCurrency } from './CurrencyContext.jsx';

// Utility for relative time
const timeAgo = (iso) => {
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
    return then.toLocaleDateString();
  } catch (e) { return ''; }
};

const toSafeString = (value, fallback = '') => {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);
  try {
    const primitive = typeof value?.valueOf === 'function' ? value.valueOf() : value;
    if (typeof primitive === 'string' || typeof primitive === 'number' || typeof primitive === 'boolean' || typeof primitive === 'bigint') {
      return String(primitive);
    }
  } catch (e) { }
  try {
    return JSON.stringify(value);
  } catch (e) { }
  try {
    return Object.prototype.toString.call(value);
  } catch (e) { }
  return fallback;
};

const sanitizeNotificationText = (value) => {
  const input = toSafeString(value, '');
  if (!input) return '';
  // Redact direct URLs and internal upload references from visible notification text.
  return input
    .replace(/\bhttps?:\/\/[^\s)\]}]+/gi, '[secure link removed]')
    .replace(/\bwww\.[^\s)\]}]+/gi, '[secure link removed]')
    .replace(/\buploaded:[^\s)\]}]+/gi, '[secure link removed]')
    .replace(/\b\/uploads\/[^\s)\]}]+/gi, '[secure link removed]');
};

const getUnreadCount = (notifications) => {
  const list = Array.isArray(notifications) ? notifications : [];
  return list.filter((n) => n && !n.read && !n.isRead).length;
};

// Status Tracker Component (copied and adapted from Creator Dashboard for consistency)
const StatusTracker = ({ currentStep, steps }) => {
  return (
    <div className="mt-3 mb-2 px-1">
      <div className="relative flex flex-col space-y-0">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step} className="flex relative pb-6 last:pb-0">
              {!isLast && (
                <div
                  className={`absolute left-[11px] top-6 w-[2px] h-full transition-colors duration-300 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`}
                  style={{ zIndex: 0 }}
                />
              )}

              <div
                className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold border-2 transition-all duration-300 flex-shrink-0
                                ${isActive ? 'border-[var(--color-gold)] bg-[var(--color-gold)] text-white shadow-[0_0_0_3px_rgba(234,179,8,0.2)]' : ''}
                                ${isCompleted ? 'border-green-500 bg-green-500 text-white' : ''}
                                ${!isActive && !isCompleted ? 'border-gray-200 bg-gray-50 text-gray-400' : ''}
                                `}
              >
                {isCompleted ? '✓' : stepNum}
              </div>

              <div className={`ml-3 text-xs font-medium pt-1 ${isActive || isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                {step}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const NotificationCard = ({ thread, onReply, onDelete, onDismiss, onOpenRequest, currentUserId, selectedLanguage }) => {
  const { formatUsdPrice } = useCurrency();
  const latestItem = thread.items[thread.items.length - 1];
  const items = thread.items || [thread];

  const isStatusUpdate = items.some(i => i.type === 'status_update');
  const isStaffAction = thread.type === 'staff_action';
  const isRequestAssigned = thread.type === 'request_assigned' || items.some(i => i.type === 'request_assigned');

  const normalizePricingType = (rawType) => {
    const type = toSafeString(rawType, '').toLowerCase();
    if (type === 'recurrent') return 'recurring';
    if (type === 'catalogue') return 'one-time';
    if (type === 'recurring' || type === 'series') return type;
    return 'one-time';
  };

  const getRequestAssignedText = (msg) => {
    const metadata = (msg && typeof msg.metadata === 'object') ? msg.metadata : {};

    const pricingType = normalizePricingType(
      metadata.requestType
      || msg?.requestType
      || msg?.flow
      || msg?.deliveryType
      || msg?.delivery
      || 'one-time'
    );

    return `You have a new ${pricingType} request check it out !`;
  };

  const getDisplayText = (msg) => {
    if (msg?.type === 'request_assigned' || isRequestAssigned) {
      return sanitizeNotificationText(getRequestAssignedText(msg));
    }
    return sanitizeNotificationText(msg?.text || msg?.message || msg?.title || '');
  };

  let currentStep = 1;
  for (let i = items.length - 1; i >= 0; i--) {
    if (items[i].type === 'status_update' && items[i].metadata && items[i].metadata.step) {
      currentStep = parseInt(items[i].metadata.step, 10);
      break;
    }
  }

  const steps = [
    'Request Received',
    'Under Review',
    'In Production',
    'Preview Ready',
    'Published',
    'Completed'
  ];

  const [isReplying, setIsReplying] = React.useState(false);
  const [replyText, setReplyText] = React.useState('');

  const [swipeOffset, setSwipeOffset] = React.useState(0);
  const touchStartRef = React.useRef(0);
  const isDraggingRef = React.useRef(false);

  let title = getTranslation('New Notification', selectedLanguage);
  let Icon = Bell;
  let iconBg = 'bg-gray-100';
  let iconColor = 'text-gray-600';
  let Avatar = null;
  let actionLabel = null;

  const otherPerson = (thread.from && thread.from.id !== currentUserId) ? thread.from : (thread.to && thread.to.id !== currentUserId ? thread.to : { name: 'Unknown' });

  const [profilePic, setProfilePic] = React.useState(
    resolveMediaUrl(otherPerson.avatar || otherPerson.image || otherPerson.photoURL || otherPerson.profilePicture) || null
  );

  React.useEffect(() => {
    if (!profilePic && otherPerson && otherPerson.id) {
      const fetchProfilePic = async () => {
        try {
          const token = localStorage.getItem('regaarder_token');
          if (!token) return;
          const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin-copy-production.up.railway.app';
          const res = await fetch(`${BACKEND}/users/${otherPerson.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const user = data && data.user ? data.user : null;
            const img = user && (user.profilePicture || user.photoURL || user.image || user.avatar);
            if (img) setProfilePic(resolveMediaUrl(img));
          }
        } catch (e) { }
      };
      fetchProfilePic();
    }
  }, [otherPerson.id, profilePic]);

  if (isStaffAction) {
    title = thread.title || 'Moderation Notice';
    Avatar = (
      <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-lg"
        style={{
          backgroundColor:
            thread.action === 'warn' ? '#fef3c7' :
            thread.action === 'ban' ? '#fecaca' :
            thread.action === 'shadowban' ? '#d1d5db' :
            thread.action === 'delete' ? '#ddd6fe' : '#f0fdf4'
        }}>
        {thread.action === 'warn' && '⚠️'}
        {thread.action === 'ban' && '🚫'}
        {thread.action === 'shadowban' && '👁️'}
        {thread.action === 'delete' && '🗑️'}
      </div>
    );
    actionLabel = null;
  } else if (isStatusUpdate) {
    title = getTranslation('Status Update from Creator', selectedLanguage);
    if (currentStep === 5) title = getTranslation('Request Fulfilled!', selectedLanguage);

    Avatar = (
      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
        {profilePic ? (
          <img src={profilePic} alt={otherPerson.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold text-sm">
            {(otherPerson.name && otherPerson.name[0]) || 'C'}
          </div>
        )}
      </div>
    );

    actionLabel = getTranslation('Reply', selectedLanguage);
  } else if (isRequestAssigned) {
    title = getTranslation('New Request', selectedLanguage);
    Avatar = (
      <div className="w-10 h-10 rounded-full bg-indigo-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
        <Bell className="w-5 h-5 text-indigo-600" />
      </div>
    );
    actionLabel = null;
  } else {
    title = getTranslation('New Message', selectedLanguage);
    Avatar = (
      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
        {profilePic ? (
          <img src={profilePic} alt={otherPerson.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold text-sm">
            {(otherPerson.name && otherPerson.name[0]) || 'C'}
          </div>
        )}
      </div>
    );
    actionLabel = getTranslation('Reply', selectedLanguage);
  }

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    if (onReply) {
      const targetItem = {
        ...latestItem,
        from: { id: otherPerson.id }
      };
      onReply(targetItem, replyText);
    }
    setReplyText('');
  };

  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartRef.current;
    if (diff < -150) setSwipeOffset(-150);
    else if (diff > 150) setSwipeOffset(150);
    else setSwipeOffset(diff);
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    if (swipeOffset < -100) {
      if (onDelete) onDelete(thread);
      setSwipeOffset(0);
    } else if (!isStaffAction && swipeOffset > 100) {
      if (!thread.ctaUrl && onDismiss) onDismiss(thread);
      setSwipeOffset(0);
    } else {
      setSwipeOffset(0);
    }
  };

  return (
    <div className="relative mb-3 select-none overflow-hidden rounded-2xl">
      <div className="absolute inset-0 flex justify-between items-center rounded-2xl">
        {!isStaffAction && (
          <div className={`flex items-center justify-start pl-6 w-full h-full bg-blue-500 rounded-2xl transition-opacity duration-200 ${swipeOffset > 0 ? 'opacity-100' : 'opacity-0'}`}>
            <Archive className="w-6 h-6 text-white" />
            <span className="text-white font-medium ml-2">Dismiss</span>
          </div>
        )}
        <div className={`absolute inset-0 flex items-center justify-end pr-6 w-full h-full bg-red-500 rounded-2xl transition-opacity duration-200 ${swipeOffset < 0 ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-white font-medium mr-2">Delete</span>
          <Trash2 className="w-6 h-6 text-white" />
        </div>
      </div>

      <div
        className="relative p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col space-y-3 transition-transform duration-200 ease-out"
        style={{ 
          transform: `translateX(${swipeOffset}px)`,
          cursor: (isStaffAction && thread.ctaUrl) ? 'pointer' : 'default'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (isStaffAction && thread.ctaUrl) {
            const url = thread.ctaUrl.startsWith('http') ? thread.ctaUrl : `https://${thread.ctaUrl}`;
            window.open(url, '_blank', 'noopener,noreferrer');
            return;
          }
          if (isRequestAssigned && thread.requestId && onOpenRequest) {
            onOpenRequest(thread.requestId);
          }
        }}
      >
        <div className="flex items-start space-x-3">
          {Avatar ? Avatar : (
            <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 leading-tight mb-0.5">{title}</h3>
                {isStaffAction ? (
                  <p className="text-xs font-medium text-gray-500 mb-1">Moderation Team</p>
                ) : (
                  <p className="text-xs font-medium text-gray-500 mb-1">{otherPerson.name}</p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDelete) onDelete(thread);
                }}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                title="Delete notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isStaffAction ? (
              <div>
                <p className="text-sm text-gray-700 mt-2 leading-relaxed whitespace-pre-wrap">{sanitizeNotificationText(thread.message)}</p>
                
                {thread.ctaUrl && (
                  <div>
                    <div
                      style={{
                        display: 'inline-block',
                        marginTop: '12px',
                        padding: '10px 16px',
                        backgroundColor: thread.ctaColor || '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        textAlign: 'center',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        position: 'relative',
                        zIndex: 50,
                        cursor: 'pointer',
                        pointerEvents: 'auto'
                      }}
                    >
                      {thread.ctaText || 'Learn More'}
                    </div>
                    <p style={{ margin: '8px 0 0', fontSize: '10px', color: '#9ca3af' }}>
                      Tap anywhere to open link
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 mt-1 max-h-60 overflow-y-auto">
                {isStatusUpdate && (
                  <div className="mb-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <StatusTracker currentStep={currentStep} steps={steps} />
                  </div>
                )}

                {items.map((msg, idx) => {
                  const isMe = msg.from && msg.from.id === currentUserId;
                  return (
                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`text-sm leading-snug px-3 py-2 rounded-lg max-w-[90%] ${isMe ? 'bg-indigo-50 text-indigo-900 rounded-br-none' : 'bg-gray-50 text-gray-800 rounded-bl-none'}`}>
                        {getDisplayText(msg)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-400">{timeAgo(latestItem.createdAt || thread.createdAt)}</span>
              {actionLabel && !isReplying && (
                <button
                  onClick={(e) => { e.stopPropagation(); setIsReplying(true); }}
                  className="text-xs font-medium hover:opacity-80 flex items-center px-2 py-1 rounded-md transition-colors hover:bg-gray-50"
                  style={{ color: 'var(--color-gold)' }}
                >
                  {actionLabel} <CornerUpRight className="w-3.5 h-3.5 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>

        {isReplying && (
          <div className="mt-2 pl-12 pr-1 w-full animate-fadeIn" onTouchStart={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
            <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400 min-w-0"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendReply();
                }}
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim()}
                className={`p-1.5 rounded-full transition-colors ${replyText.trim() ? 'bg-[var(--color-gold)] text-white' : 'bg-gray-200 text-gray-400'}`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsReplying(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description, iconColor, iconBg }) => (
  <div className="flex items-center p-4 bg-white rounded-xl shadow-sm transition duration-200 border border-gray-200 cursor-pointer hover:shadow-md">
    <div className="flex items-center justify-center w-10 h-10 mr-4 rounded-full" style={{ backgroundColor: iconBg }}>
      <Icon className="w-5 h-5" style={{ color: iconColor }} strokeWidth={1.5} />
    </div>
    <div>
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </div>
);

const NotificationsPage = ({ onClose }) => {
  const selectedLanguage = (typeof window !== 'undefined') ? window.localStorage.getItem('regaarder_language') || 'English' : 'English';

  React.useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const lang = window.localStorage.getItem('regaarder_language') || 'English';
      const map = translations && translations[lang] ? translations[lang] : {};
      if (!map || Object.keys(map).length === 0) return;
      const container = document.querySelector('.min-h-screen') || document.body;
      if (!container) return;
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
      const keys = Object.keys(map).sort((a, b) => b.length - a.length);
      let node;
      while ((node = walker.nextNode())) {
        const txt = node.nodeValue;
        if (!txt || !txt.trim()) continue;
        let changed = txt;
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          const v = map[k];
          if (!k || typeof v !== 'string') continue;
          if (changed.indexOf(k) !== -1) changed = changed.split(k).join(v);
        }
        if (changed !== txt) node.nodeValue = changed;
      }
    } catch (e) { }
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
      return;
    }
    try {
      const params = new URLSearchParams(location.search || '');
      const from = params.get('from');
      if (from) {
        navigate(from.startsWith('/') ? from : `/${from}`, { replace: true });
        return;
      }
    } catch (e) {
    }
    try {
      if (typeof window !== 'undefined' && typeof window.__setAppPage === 'function') {
        window.__setAppPage('home');
        return;
      }
    } catch (e) { }

    navigate('/home', { replace: true });
  };

  const [loading, setLoading] = React.useState(true);
  const [hasNotifications, setHasNotifications] = React.useState(false);
  const [groupedSuggestions, setGroupedSuggestions] = React.useState([]);
  const [userId, setUserId] = React.useState(null);
  const [showFilterModal, setShowFilterModal] = React.useState(false);
  const [filters, setFilters] = React.useState({
    dateRange: 'all',
    category: 'all',
    importance: 'all',
    sortBy: 'newest'
  });
  const [filteredSuggestions, setFilteredSuggestions] = React.useState([]);
  const [isClearingAll, setIsClearingAll] = React.useState(false);

  const syncNotificationCache = React.useCallback((notifications) => {
    try {
      const safe = Array.isArray(notifications) ? notifications : [];
      const unread = getUnreadCount(safe);
      localStorage.setItem('notifications_center_cache', JSON.stringify(safe));
      localStorage.setItem('notifications_count', String(unread));
      window.dispatchEvent(new CustomEvent('notifications:updated', { detail: { count: unread } }));
    } catch (e) { }
  }, []);

  const [toast, setToast] = React.useState(null);
  const toastCountdownIntervalRef = React.useRef(null);
  const deleteTimersRef = React.useRef(new Map());
  const deletedThreadSnapshotsRef = React.useRef(new Map());
  const pendingDeleteIdsRef = React.useRef(new Set());

  const fetchNotifications = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('regaarder_token');
      if (!token) return;
      const res = await fetch(`${(window && window.__BACKEND_URL__) || 'https://pwin-copy-production.up.railway.app'}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        setGroupedSuggestions([]);
        setFilteredSuggestions([]);
        setHasNotifications(false);
        syncNotificationCache([]);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        let arr = (data && data.notifications) || [];
        const pendingIds = pendingDeleteIdsRef.current;
        if (pendingIds && pendingIds.size) {
          const backendIds = new Set(arr.map((item) => toSafeString(item && item.id, '')));
          pendingIds.forEach((id) => {
            const normalizedId = toSafeString(id, '');
            if (!backendIds.has(normalizedId)) pendingIds.delete(normalizedId);
          });
        }
        if (pendingIds && pendingIds.size) {
          arr = arr.filter((item) => !pendingIds.has(toSafeString(item && item.id, '')));
        }
        const uid = data.userId;
        setUserId(uid);

        const threads = {};
        arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        arr.forEach(item => {
          let key = item.requestId ? `req-${item.requestId}` : null;
          if (!key) {
            const otherId = (item.from && item.from.id === uid) ? (item.to && item.to.id) : (item.from && item.from.id);
            if (otherId) key = `user-${otherId}`;
            else key = 'misc';
          }

          if (!threads[key]) threads[key] = { ...item, id: key, items: [], lastTime: item.createdAt };
          threads[key].items.push(item);
          threads[key].lastTime = item.createdAt;

          if (item.from && item.from.id !== uid) {
            threads[key].from = item.from;
          }
        });

        const sortedThreads = Object.values(threads).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
        setGroupedSuggestions(sortedThreads);
        setHasNotifications(sortedThreads.length > 0);
        syncNotificationCache(arr);
      } else {
        setGroupedSuggestions([]);
        setFilteredSuggestions([]);
        setHasNotifications(false);
        syncNotificationCache([]);
      }
    } catch (e) { }
    finally {
      setLoading(false);
    }
  }, [syncNotificationCache]);

  const handleClearAll = () => {
    if (isClearingAll) return;
    if (!groupedSuggestions.length) return;

    (async () => {
      const token = localStorage.getItem('regaarder_token');
      if (!token) {
        setToast({ message: 'Please sign in again to clear notifications.' });
        return;
      }

      setIsClearingAll(true);
      const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin-copy-production.up.railway.app';

      try {
        const res = await fetch(`${BACKEND}/notifications`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          setGroupedSuggestions([]);
          setFilteredSuggestions([]);
          setHasNotifications(false);
          syncNotificationCache([]);
          setToast({ message: 'All notifications cleared.' });
        } else {
          setToast({ message: 'Could not clear notifications. Try again.' });
          fetchNotifications();
        }
      } catch (e) {
        setToast({ message: 'Network error. Please try again.' });
        fetchNotifications();
      }

      setIsClearingAll(false);
    })();
  };

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  React.useEffect(() => {
    let filtered = [...groupedSuggestions];

    if (filters.dateRange !== 'all') {
      let cutoffDate = new Date();
      if (filters.dateRange === 'today') {
        cutoffDate.setHours(0, 0, 0, 0);
      } else if (filters.dateRange === 'week') {
        cutoffDate.setDate(cutoffDate.getDate() - 7);
      } else if (filters.dateRange === 'month') {
        cutoffDate.setDate(cutoffDate.getDate() - 30);
      }
      filtered = filtered.filter(thread => new Date(thread.lastTime) >= cutoffDate);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(thread => {
        if (filters.category === 'status_update') {
          return thread.items && thread.items.some(i => i.type === 'status_update');
        } else if (filters.category === 'staff_action') {
          return thread.type === 'staff_action';
        } else if (filters.category === 'message') {
          return !thread.type || thread.type !== 'staff_action';
        }
        return true;
      });
    }

    if (filters.importance !== 'all') {
      filtered = filtered.filter(thread => {
        if (filters.importance === 'high') {
          return thread.type === 'staff_action' || (thread.items && thread.items.some(i => i.type === 'status_update'));
        } else if (filters.importance === 'medium') {
          return true;
        } else if (filters.importance === 'low') {
          return thread.items && !thread.items.some(i => i.type === 'status_update') && thread.type !== 'staff_action';
        }
        return true;
      });
    }

    if (filters.sortBy === 'oldest') {
      filtered = filtered.sort((a, b) => new Date(a.lastTime) - new Date(b.lastTime));
    } else {
      filtered = filtered.sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
    }

    setFilteredSuggestions(filtered);
  }, [groupedSuggestions, filters]);

  React.useEffect(() => {
    return () => {
      const token = localStorage.getItem('regaarder_token');
      const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin-copy-production.up.railway.app';
      deleteTimersRef.current.forEach((timerId, threadKey) => {
        clearTimeout(timerId);
        const snapshot = deletedThreadSnapshotsRef.current.get(threadKey);
        if (snapshot && token) {
          const itemsToDelete = snapshot.items || [snapshot];
          itemsToDelete.forEach((item) => {
            if (item && item.id != null) {
              fetch(`${BACKEND}/notifications/${item.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              }).catch(() => {});
            }
          });
        }
      });
      deleteTimersRef.current.clear();
      deletedThreadSnapshotsRef.current.clear();
      if (toastCountdownIntervalRef.current) {
        clearInterval(toastCountdownIntervalRef.current);
        toastCountdownIntervalRef.current = null;
      }
    };
  }, []);

  const handleDismiss = (thread) => {
    setGroupedSuggestions(prev => {
      const next = prev.filter(t => t.id !== thread.id);
      const flattened = next.flatMap((t) => Array.isArray(t.items) ? t.items : [t]);
      syncNotificationCache(flattened);
      setHasNotifications(next.length > 0);
      return next;
    });
  };

  const handleDelete = (thread) => {
    const threadKey = toSafeString(thread && thread.id, '');
    deletedThreadSnapshotsRef.current.set(threadKey, thread);

    setGroupedSuggestions(prev => {
      const next = prev.filter(t => t.id !== thread.id);
      const flattened = next.flatMap((t) => Array.isArray(t.items) ? t.items : [t]);
      syncNotificationCache(flattened);
      setHasNotifications(next.length > 0);
      return next;
    });

    const itemsToDelete = thread.items || [thread];
    itemsToDelete.forEach((item) => {
      if (item && item.id != null) pendingDeleteIdsRef.current.add(toSafeString(item.id, ''));
    });

    (async () => {
      const token = localStorage.getItem('regaarder_token');
      if (!token) {
        setToast(null);
        return;
      }
      const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin-copy-production.up.railway.app';

      const results = await Promise.all((itemsToDelete || []).map((item) => {
        if (!item || item.id == null) return Promise.resolve(false);
        return fetch(`${BACKEND}/notifications/${item.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }).then((res) => res.ok).catch(() => false);
      }));

      const allOk = results.length ? results.every(Boolean) : true;

      if (!allOk) {
        itemsToDelete.forEach((item) => {
          if (item && item.id != null) pendingDeleteIdsRef.current.delete(toSafeString(item.id, ''));
        });
        const snapshot = deletedThreadSnapshotsRef.current.get(threadKey) || thread;
        setGroupedSuggestions(prev => {
          if (prev.some(t => toSafeString(t && t.id, '') === threadKey)) return prev;
          const arr = [...prev, snapshot];
          const flattened = arr.flatMap((t) => Array.isArray(t.items) ? t.items : [t]);
          syncNotificationCache(flattened);
          setHasNotifications(arr.length > 0);
          return arr.sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
        });
        setToast({ message: 'Delete failed. Restored notification.' });
      } else {
        setToast(null);
      }

      deleteTimersRef.current.delete(threadKey);
      deletedThreadSnapshotsRef.current.delete(threadKey);
      if (toastCountdownIntervalRef.current) {
        clearInterval(toastCountdownIntervalRef.current);
        toastCountdownIntervalRef.current = null;
      }
    })();
  };

  const handleOpenRequestFromNotification = (requestId) => {
    if (!requestId) return;
    const target = toSafeString(requestId, '');
    if (!target) return;
    navigate(`/requests?focus=${encodeURIComponent(target)}`);
  };

  const handleReply = async (item, text) => {
    const token = localStorage.getItem('regaarder_token');
    if (!token) return;
    try {
      const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin-copy-production.up.railway.app';
      await fetch(`${BACKEND}/suggestion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: text,
          targetCreatorId: item.from ? item.from.id : null,
          requestId: item.requestId,
          type: 'reply',
          parentId: item.id
        })
      });

      fetchNotifications();
    } catch (e) {
      console.error('Failed to send reply', e);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes ripple-expand {
            0% {
              transform: scale(0.5);
              opacity: 0.7;
            }
            100% {
              transform: scale(3.5);
              opacity: 0;
            }
          }

          @keyframes bell-pulse {
            0% { 
                opacity: 1;
                filter: brightness(1) saturate(1);
            }
            50% { 
                opacity: 0.8;
                filter: brightness(0.9) saturate(0.8);
            }
            100% { 
                opacity: 1;
                filter: brightness(1) saturate(1);
            }
          }

          .inner-bell-container {
            position: relative; 
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background-color: var(--color-gold-light, rgba(202,138,4,0.3));
          }

          .inner-bell-container .bell-icon {
            z-index: 10;
            position: relative;
            animation: bell-pulse 2.5s ease-in-out infinite;
            transition: opacity 0.5s, filter 0.5s;
          }

          .inner-bell-container::before,
          .inner-bell-container::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-color: var(--color-gold-light, rgba(202,138,4,0.4)); 
            opacity: 0;
            z-index: 0;
            transform: scale(0.5);
          }

          @media (min-width: 640px) {
            .inner-bell-container { width: 64px; height: 64px; }
            .inner-bell-container .bell-icon { width: 28px; height: 28px; }
          }

          .inner-bell-container::before {
            animation: ripple-expand 2.5s ease-out infinite;
          }

          .inner-bell-container::after {
            animation: ripple-expand 2.5s ease-out infinite;
            animation-delay: 1.25s;
          }

          .icon-press {
            transition: transform 160ms cubic-bezier(.2,.8,.2,1), opacity 120ms;
            will-change: transform, opacity;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .icon-press:active {
            transform: scale(0.92);
            opacity: 0.95;
          }
          .icon-press svg {
            transition: transform 160ms cubic-bezier(.2,.8,.2,1);
          }
          .icon-press:active svg {
            transform: translateY(1px) scale(0.92);
          }

          input[type="radio"] {
            accent-color: var(--color-gold, #ca8a04);
            cursor: pointer;
          }
          .icon-press svg {
            transition: transform 160ms cubic-bezier(.2,.8,.2,1);
          }
          .icon-press:active svg {
            transform: translateY(1px) scale(0.92);
          }
        `}
      </style>

      <div className="min-h-screen bg-gray-50 flex justify-center p-0 font-sans">
        <div className="w-full sm:max-w-sm bg-white shadow-2xl flex flex-col sm:rounded-2xl overflow-hidden">
          <header
            className="p-4 pl-12 pr-4 border-b border-gray-100 flex items-center gap-3 relative"
            style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}
          >
            <ChevronLeft
              onClick={handleClose}
              className="w-6 h-6 cursor-pointer transition hover:text-gray-900 absolute left-4"
              style={{ color: 'var(--color-gold, #ca8a04)' }}
            />

            <h1 className="text-xl font-bold text-gray-800 truncate">{getTranslation('Notifications', selectedLanguage)}</h1>

            <button
              onClick={handleClearAll}
              disabled={isClearingAll || !groupedSuggestions.length}
              className="ml-auto h-9 px-4 rounded-full text-xs font-semibold border border-amber-200 text-amber-700 bg-gradient-to-b from-amber-50 to-white shadow-sm transition hover:shadow-md hover:border-amber-300"
            >
              {isClearingAll ? getTranslation('Clearing...', selectedLanguage) : getTranslation('Clear All', selectedLanguage)}
            </button>

            <button
              onClick={() => setShowFilterModal(!showFilterModal)}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-gray-100 shadow-sm hover:shadow-md transition"
            >
              <Filter className="w-5 h-5" style={{ color: 'rgb(107 114 128)' }} />
            </button>
          </header>

          {showFilterModal && (
            <div
              className="fixed inset-0 z-30 flex items-start justify-center pt-20 px-4"
              onClick={() => setShowFilterModal(false)}
            >
              <div
                className="bg-white w-full max-w-md rounded-2xl shadow-lg border border-gray-100 max-h-[45vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <header className="p-6 border-b flex-shrink-0">
                  <div className="relative">
                    <button
                      onClick={() => setShowFilterModal(false)}
                      aria-label="Close filters"
                      className="absolute right-0 top-0 -mr-2 -mt-2 w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <h2 className="text-lg font-semibold text-gray-900">{getTranslation('Filter Notifications', selectedLanguage)}</h2>
                    <p className="text-xs text-gray-500 mt-1">{getTranslation('Customize what you see', selectedLanguage)}</p>
                  </div>
                </header>
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">{getTranslation('Date Range', selectedLanguage)}</h3>
                    <div className="space-y-2">
                      {[
                        { value: 'all', label: getTranslation('All Time', selectedLanguage) },
                        { value: 'today', label: getTranslation('Today', selectedLanguage) },
                        { value: 'week', label: getTranslation('Last 7 Days', selectedLanguage) },
                        { value: 'month', label: getTranslation('Last 30 Days', selectedLanguage) }
                      ].map(option => (
                        <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="dateRange"
                            value={option.value}
                            checked={filters.dateRange === option.value}
                            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span className="text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">{getTranslation('Category', selectedLanguage)}</h3>
                    <div className="space-y-2">
                      {[
                        { value: 'all', label: getTranslation('All Categories', selectedLanguage) },
                        { value: 'status_update', label: getTranslation('Status Updates', selectedLanguage) },
                        { value: 'staff_action', label: getTranslation('Moderation Notices', selectedLanguage) },
                        { value: 'message', label: getTranslation('Messages', selectedLanguage) }
                      ].map(option => (
                        <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="category"
                            value={option.value}
                            checked={filters.category === option.value}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span className="text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">{getTranslation('Importance', selectedLanguage)}</h3>
                    <div className="space-y-2">
                      {[
                        { value: 'all', label: getTranslation('All Importance Levels', selectedLanguage) },
                        { value: 'high', label: getTranslation('High (Status & Moderation)', selectedLanguage) },
                        { value: 'medium', label: getTranslation('Medium (All Notifications)', selectedLanguage) },
                        { value: 'low', label: getTranslation('Low (Messages Only)', selectedLanguage) }
                      ].map(option => (
                        <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="importance"
                            value={option.value}
                            checked={filters.importance === option.value}
                            onChange={(e) => setFilters({ ...filters, importance: e.target.value })}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span className="text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">{getTranslation('Sort By', selectedLanguage)}</h3>
                    <div className="space-y-2">
                      {[
                        { value: 'newest', label: getTranslation('Newest First', selectedLanguage) },
                        { value: 'oldest', label: getTranslation('Oldest First', selectedLanguage) }
                      ].map(option => (
                        <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="sortBy"
                            value={option.value}
                            checked={filters.sortBy === option.value}
                            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span className="text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <footer className="p-6 border-t flex-shrink-0 bg-white">
                  <button
                    onClick={() => setFilters({ dateRange: 'all', category: 'all', importance: 'all', sortBy: 'newest' })}
                    className="w-full py-2 px-4 rounded-lg font-medium text-white transition hover:shadow-md"
                    style={{ backgroundColor: 'var(--color-gold, #ca8a04)' }}
                  >
                    {getTranslation('Reset All Filters', selectedLanguage)}
                  </button>
                </footer>
              </div>
            </div>
          )}
          <main className="p-6 flex-grow overflow-y-auto">
            {loading ? (
              <div className="pb-20">
                <div className="w-full px-4 py-3 mb-4 bg-gray-200 rounded-xl animate-pulse" style={{ height: '50px' }}></div>
                {[...Array(3)].map((_, idx) => (
                  <div key={idx} className="mb-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
                      <div className="flex-grow">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : hasNotifications ? (
              <div className="pb-20">
                <div className="w-full px-4 py-3 mb-4 bg-[#F5F5DC] text-gray-700 rounded-xl flex items-start space-x-2" style={{ borderColor: 'var(--color-gold-light)', borderStyle: 'solid', boxShadow: '0 6px 16px rgba(var(--color-gold-rgb,203,138,0),0.06)' }}>
                  <Lightbulb className="w-4 h-4 mt-0.5 text-[var(--color-gold)] flex-shrink-0" />
                  <p className="text-xs leading-relaxed font-medium">{getTranslation('Swipe left to delete • Swipe right to dismiss temporarily', selectedLanguage)}</p>
                </div>

                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((thread) => (
                    <NotificationCard
                      key={thread.id}
                      thread={thread}
                      onReply={handleReply}
                      onDelete={handleDelete}
                      onDismiss={handleDismiss}
                      onOpenRequest={handleOpenRequestFromNotification}
                      currentUserId={userId}
                      selectedLanguage={selectedLanguage}
                    />
                  ))
                ) : (
                  <div className="text-center pt-12 pb-8">
                    <p className="text-gray-500">{getTranslation('No notifications match your filters', selectedLanguage)}</p>
                    <button
                      onClick={() => setFilters({ dateRange: 'all', category: 'all', importance: 'all' })}
                      className="mt-4 text-sm text-blue-600 hover:underline"
                    >
                      {getTranslation('Reset filters', selectedLanguage)}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center pt-8 pb-12">
                <div className="inner-bell-container mx-auto mb-20">
                  <Bell className="w-8 h-8 bell-icon" strokeWidth={1.5} style={{ color: 'var(--color-gold, #ca8a04)' }} />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{getTranslation('All caught up!', selectedLanguage)}</h2>
                <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">{getTranslation("You don't have any notifications right now. We'll let you know when something important happens.", selectedLanguage)}</p>
              </div>
            )}

            {!loading && !hasNotifications && (
              <div className="space-y-4 pt-4">
                <FeatureCard
                  icon={CheckCircle}
                  title={getTranslation('Request Updates', selectedLanguage)}
                  description={getTranslation('Get notified when creators start or complete your requests', selectedLanguage)}
                  iconColor="#16A34A"
                  iconBg="#ECFDF5"
                />
                <FeatureCard
                  icon={Rocket}
                  title={getTranslation('Viral Rewards', selectedLanguage)}
                  description={getTranslation('Earn money when your requests go viral', selectedLanguage)}
                  iconColor="#F97316"
                  iconBg="#FFF7ED"
                />
                <FeatureCard
                  icon={Trophy}
                  title={getTranslation('Milestones & Achievements', selectedLanguage)}
                  description={getTranslation('Celebrate your progress and unlock rewards', selectedLanguage)}
                  iconColor="var(--color-gold, #ca8a04)"
                  iconBg="var(--color-gold-light-bg, rgba(202,138,4,0.08))"
                />
              </div>
            )}
          </main>

          {toast && (
            <div
              className="fixed bottom-20 left-0 right-0 flex justify-center z-50 pointer-events-none"
            >
              <div
                className="bg-gray-900 text-white p-3 mx-4 rounded-xl shadow-2xl flex items-center justify-between space-x-4 transition-all duration-300 max-w-sm w-full pointer-events-auto"
              >
                <span className="text-sm font-medium">{toast.message}</span>
                {typeof toast.onUndo === 'function' && (
                  <button
                    onClick={toast.onUndo}
                    className="text-sm font-bold text-[var(--color-gold)] hover:underline"
                  >
                    UNDO
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export { NotificationsPage };
export default NotificationsPage;
