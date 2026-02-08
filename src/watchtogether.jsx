/* eslint-disable no-empty */
import React, { useState, useMemo, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, X, Search, Folder, Bookmark, Play, Calendar, Video, Clock } from 'lucide-react';
import { getTranslation } from './translations';

// Local fallback Search context/provider/hook so this file doesn't depend on `./home` being present.
const SearchContext = createContext({ search: '', setSearch: () => { } });
const DefaultSearchProvider = ({ children }) => {
  const [search, setSearch] = useState('');
  return <SearchContext.Provider value={{ search, setSearch }}>{children}</SearchContext.Provider>;
};
const useLocalSearch = () => useContext(SearchContext);

// Default placeholders for videos and getVideoById — will be replaced if `./home` loads.
const DEFAULT_VIDEOS = [];
const defaultGetVideoById = (id, videos = DEFAULT_VIDEOS) => videos.find((v) => v && (v.id === id || v.id == id)) || null;

// Provide module-local aliases used by the components below. VideoSelection will receive `videos` via props.
const SearchProvider = DefaultSearchProvider;
const useSearch = useLocalSearch;

// Videos are now provided by `home.jsx` (imported as `VIDEOS`)

// Backend API URL
const API_BASE = (typeof window !== 'undefined' && window.__BACKEND_URL__)
  || import.meta.env.VITE_BACKEND_URL
  || import.meta.env.VITE_BACKEND
  || 'https://pwin.onrender.com';

// Helper to resolve user avatar/image URLs
const resolveImageUrl = (url) => {
  if (!url) return '';
  try {
    const s = String(url || '');
    if (s.startsWith('uploaded:')) {
      const filename = s.split(':')[1] || s.slice('uploaded:'.length);
      return `${API_BASE}/uploads/${filename}`;
    }
    if (s.startsWith('http') || s.startsWith('https')) return s;
    return s;
  } catch (e) {
    return url;
  }
};

// Helper to generate placeholder avatar showing a flag derived from name initials
const getPlaceholderAvatar = (name) => {
  const initials = (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  const colors = ['f87171', '34d399', 'a78bfa', '60a5fa', 'fbbf24', 'ec4899', 'fb923c', '4ade80'];
  const colorIndex = (name || '').charCodeAt(0) % colors.length;
  const normalized = initials.padEnd(2, 'U').substring(0, 2);
  const A_CODE = 'A'.charCodeAt(0);

  // If we have two A-Z characters, build a Twemoji URL for a colored flag PNG
  if (/^[A-Z]{2}$/.test(normalized)) {
    const hexes = Array.from(normalized).map(ch => {
      const cp = 0x1F1E6 + (ch.charCodeAt(0) - A_CODE);
      return cp.toString(16);
    }).join('-');
    // Twemoji serves images like: https://twemoji.maxcdn.com/v/latest/72x72/1f1fa-1f1f8.png
    return `https://twemoji.maxcdn.com/v/latest/72x72/${hexes}.png`;
  }

  // Fallback to a simple globe SVG when initials aren't A-Z
  const flagEmoji = '🌐';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' fill='#${colors[colorIndex]}' rx='20' ry='20' /><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='18' font-family='Segoe UI Emoji, Noto Color Emoji, Apple Color Emoji, sans-serif'>${flagEmoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// Utility to get today's and tomorrow's date strings for the mock dropdown
const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// Reusable component for the steps in the flow
const StepTitle = ({ number, title, required = false, badge = null, selectedLanguage = 'English' }) => (
  <div className="flex items-center space-x-2 my-6">
    <div className="flex items-center justify-center w-6 h-6 bg-violet-600 text-white text-xs font-semibold rounded-full shadow-lg">
      {number}
    </div>
    <h2 className="text-lg font-semibold text-gray-800">{getTranslation(title, selectedLanguage)}</h2>
    {required && (
      <span className="text-xs font-medium text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
        {getTranslation('Required', selectedLanguage)}
      </span>
    )}
    {badge !== null && (
      <span className="ml-auto text-xs font-medium text-white bg-violet-400 px-2 py-0.5 rounded-full">
        {badge} {getTranslation('selected', selectedLanguage)}
      </span>
    )}
  </div>
);

// Renders the main Watch Together icon at the top
const WatchPartyIcon = ({ selectedLanguage = 'English' }) => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="relative">
      <div className="p-4 bg-violet-100 rounded-full">
        <Users className="w-10 h-10 text-violet-500" />
      </div>
      <div className="absolute top-0 right-0 w-3 h-3 bg-violet-500 rounded-full border-2 border-white" />
    </div>
    <h3 className="text-xl font-semibold text-gray-800 mt-4">{getTranslation('Create Watch Party', selectedLanguage)}</h3>
    <p className="text-sm text-gray-500 mt-1">{getTranslation('Set up synchronized viewing with friends', selectedLanguage)}</p>
  </div>
);

// Simple Error Boundary to show render errors instead of a blank page
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6">
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            <h3 className="font-semibold">An error occurred</h3>
            <pre className="whitespace-pre-wrap text-sm mt-2">{String(this.state.error)}</pre>
            {this.state.info && <pre className="whitespace-pre-wrap text-xs mt-2">{String(this.state.info.componentStack)}</pre>}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Step 1: Video Selection
const VideoSelection = ({ onVideoSelect, videos = [], selectedLanguage = 'English' }) => {
  const { search, setSearch } = useSearch();
  const normalized = (search || '').trim().toLowerCase();
  const list = normalized
    ? videos.filter((v) => (v.title || '').toLowerCase().includes(normalized) || (v.channel || '').toLowerCase().includes(normalized))
    : videos;

  return (
    <>
      <StepTitle number={1} title="Select Video" required={true} selectedLanguage={selectedLanguage} />
      {/* Search Input - synced with home.jsx SearchProvider */}
      <div className="relative">
        <input
          name="videoSearch"
          type="text"
          placeholder={getTranslation('Search videos...', selectedLanguage)}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition duration-150"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>

      {/* Tabs */}
      <div className="flex space-x-3 mt-4">
        <button className="flex items-center space-x-2 px-4 py-2 bg-violet-50 rounded-xl text-sm font-medium text-gray-700 hover:bg-violet-100 transition duration-150">
          <Folder className="w-5 h-5 text-gray-600" />
          <span>{getTranslation('From Folders', selectedLanguage)}</span>
        </button>
        <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition duration-150">
          <Bookmark className="w-5 h-5 text-gray-600" />
          <span>{getTranslation('Bookmarks', selectedLanguage)}</span>
        </button>
      </div>

      {/* Video List - SCROLLABLE CONTAINER */}
      <div className="mt-6 p-4 rounded-xl border border-violet-200 bg-white max-h-64 overflow-y-auto shadow-sm">
        <div className="space-y-2">
          {list.map((video) => (
            <div
              key={video.id}
              onClick={() => onVideoSelect && onVideoSelect(video.id)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => { if (e.key === 'Enter') onVideoSelect && onVideoSelect(video.id); }}
              className={`cursor-pointer py-3 px-2 rounded-lg transition duration-150 ${video.isCurrent
                  ? 'bg-violet-50' // Highlighted background for current video
                  : 'hover:bg-gray-50'
                }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4 mt-1">
                  {video.isCurrent ? (
                    <Play className="w-5 h-5 text-violet-600" fill="currentColor" />
                  ) : (
                    <Video className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div>
                  <p
                    className={`font-medium ${video.isCurrent ? 'text-violet-700' : 'text-gray-800'
                      }`}
                  >
                    {video.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {video.isCurrent ? (
                      video.subtitle
                    ) : (
                      <>
                        <span className="font-mono">{video.subtitle}</span>
                        <span className="mx-2 text-xs">•</span>
                        <span className="font-normal">{video.channel}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// Step 2: Invite Friends
const InviteFriends = ({ selectedFriends, toggleFriend, selectedFriendsCount, friends, searchQuery, setSearchQuery, selectedLanguage = 'English' }) => {
  // Filter friends based on search query
  const filteredFriends = friends.filter(friend => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (friend.name || '').toLowerCase().includes(query) ||
      (friend.email || '').toLowerCase().includes(query);
  });

  return (
    <>
      <StepTitle number={2} title="Invite Friends" badge={selectedFriendsCount} selectedLanguage={selectedLanguage} />
      {/* Search Input - FOCUS TO GREY */}
      <div className="relative mb-6">
        <input
          name="friendSearch"
          type="text"
          placeholder={getTranslation('Search friends...', selectedLanguage)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition duration-150"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>

      {/* Friend List */}
      <div className="space-y-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 max-h-96 overflow-y-auto">
        {filteredFriends.length === 0 ? (
          <p className="text-center text-gray-500 py-4">{getTranslation('No friends found', selectedLanguage)}</p>
        ) : (
          filteredFriends.map((friend) => {
            const isSelected = selectedFriends.includes(friend.id);
            const isOnline = friend.status === 'Online';
            const avatarUrl = friend.image ? resolveImageUrl(friend.image) : getPlaceholderAvatar(friend.name);
            return (
              <div
                key={friend.id}
                onClick={() => toggleFriend(friend.id)}
                className={`flex items-center p-2 rounded-lg cursor-pointer transition duration-150 ${isSelected
                    ? 'bg-violet-50 border border-violet-200'
                    : 'hover:bg-gray-50'
                  }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={avatarUrl}
                    alt={friend.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getPlaceholderAvatar(friend.name);
                    }}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                  />
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-800">{friend.name}</p>
                  <p
                    className={`text-sm ${isOnline ? 'text-green-500' : 'text-gray-500'
                      }`}
                  >
                    {friend.status}
                  </p>
                </div>
                {/* The subtle selection ring/border shown in the image is handled by the container styling above */}
                <div
                  className={`ml-auto w-5 h-5 border-2 rounded-full flex-shrink-0 ${isSelected
                      ? 'bg-violet-600 border-violet-600'
                      : 'border-gray-300'
                    }`}
                >
                  {isSelected && <CheckIcon />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

// Helper Checkmark for selected friends (using inline SVG for better control)
const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-white w-4 h-4 translate-x-0.5"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

// Step 3: When to Watch
const WhenToWatch = ({ watchTimeMode, setWatchTimeMode, selectedLanguage = 'English' }) => {
  const [sendReminders, setSendReminders] = useState(true);

  const isNowActive = watchTimeMode === 'now';
  const isScheduleActive = watchTimeMode === 'schedule';

  return (
    <>
      <StepTitle number={3} title="When to Watch" selectedLanguage={selectedLanguage} />
      <div className="flex space-x-4 mt-4">
        {/* Start Now Button */}
        <button
          onClick={() => setWatchTimeMode('now')}
          className={`flex-1 flex flex-col items-center justify-center p-6 rounded-xl shadow-lg transition duration-150 transform hover:scale-[1.02] active:scale-[0.98] ${isNowActive
              ? 'bg-violet-600 text-white' // Active (Purple)
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' // Inactive (White/Grey)
            }`}
        >
          <Play className={`w-8 h-8 mb-2 ${isNowActive ? 'text-white' : 'text-gray-700'}`} />
          <span className="text-lg font-semibold">{getTranslation('Start Now', selectedLanguage)}</span>
          <span className={`text-sm font-light ${isNowActive ? 'opacity-80' : 'text-gray-500'}`}>{getTranslation('Begin immediately', selectedLanguage)}</span>
        </button>

        {/* Schedule Button */}
        <button
          onClick={() => setWatchTimeMode('schedule')}
          className={`flex-1 flex flex-col items-center justify-center p-6 rounded-xl shadow-lg transition duration-150 transform hover:scale-[1.02] active:scale-[0.98] ${isScheduleActive
              ? 'bg-violet-600 text-white' // Active (Purple) - Matches image when Schedule is selected
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' // Inactive (White/Grey)
            }`}
        >
          <Calendar className={`w-8 h-8 mb-2 ${isScheduleActive ? 'text-white' : 'text-gray-700'}`} />
          <span className="text-lg font-semibold">{getTranslation('Schedule', selectedLanguage)}</span>
          <span className={`text-sm font-light ${isScheduleActive ? 'opacity-80' : 'text-gray-500'}`}>{getTranslation('Set a time', selectedLanguage)}</span>
        </button>
      </div>

      {/* Conditional Scheduling Form (Visible when 'schedule' is active) */}
      {isScheduleActive && (
        <div className="mt-6 space-y-5">
          {/* Date & Time Pickers */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">{getTranslation('Date', selectedLanguage)}</label>
              <select
                id="date"
                className="w-full py-3 pl-4 pr-10 border border-gray-300 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition duration-150 bg-white text-gray-800"
                defaultValue="today"
              >
                <option value="today">{getTranslation('Today', selectedLanguage)}, {today}</option>
                <option value="tomorrow">{getTranslation('Tomorrow', selectedLanguage)}, {tomorrow}</option>
                <option value="custom">{getTranslation('Pick a date...', selectedLanguage)}</option>
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">{getTranslation('Time', selectedLanguage)}</label>
              <select
                id="time"
                className="w-full py-3 pl-4 pr-10 border border-gray-300 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition duration-150 bg-white text-gray-800"
                defaultValue="6pm"
              >
                <option value="6pm">6:00 PM</option>
                <option value="7pm">7:00 PM</option>
                <option value="8pm">8:00 PM</option>
              </select>
            </div>
          </div>

          {/* Reminder Checkbox and Dropdown */}
          <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-violet-100 rounded-full">
                  {/* Using Clock icon as a stand-in for the bell/notification icon */}
                  <Clock className="w-5 h-5 text-violet-600" />
                </div>
                <label
                  htmlFor="sendReminders"
                  className="text-base font-medium text-gray-800 cursor-pointer"
                >
                  {getTranslation('Send Reminders', selectedLanguage)}
                </label>
              </div>
              <input
                id="sendReminders"
                type="checkbox"
                checked={sendReminders}
                onChange={(e) => setSendReminders(e.target.checked)}
                // Custom checkbox styling to match purple theme
                className="w-5 h-5 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500 checked:bg-violet-600 checked:border-transparent"
              />
            </div>

            {sendReminders && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <select
                  id="reminderTime"
                  className="py-2 pl-3 pr-8 border border-gray-300 rounded-xl appearance-none outline-none focus:ring-1 focus:ring-gray-200 focus:border-gray-400 transition duration-150 bg-white text-sm text-gray-800 w-full"
                  defaultValue="15min"
                >
                  <option value="5min">{getTranslation('5 minutes before', selectedLanguage)}</option>
                  <option value="15min">{getTranslation('15 minutes before', selectedLanguage)}</option>
                  <option value="30min">{getTranslation('30 minutes before', selectedLanguage)}</option>
                  <option value="1hr">{getTranslation('1 hour before', selectedLanguage)}</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const App = () => {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      console.log('WatchTogether App mounted');
    } catch (e) {
      console.error('mount log failed', e);
    }
  }, []);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [selectedLanguage] = useState(() => localStorage.getItem('regaarder_language') || 'English');
  // NEW STATE: To track if 'now' or 'schedule' is selected
  const [watchTimeMode, setWatchTimeMode] = useState('now');
  // Error state for display
  const [errorMessage, setErrorMessage] = useState(null);
  // Friends state
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  // Videos and optional helper loaded dynamically from `./home` if available.
  const [videos, setVideos] = useState(DEFAULT_VIDEOS);
  const [getVideoByIdFunc, setGetVideoByIdFunc] = useState(() => (id) => defaultGetVideoById(id, videos));

  // Fetch users from backend
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await fetch(`${API_BASE}/users`);
        if (!mounted) return;
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        const usersList = (data.users || []).map(u => ({
          id: u.id,
          name: u.name || 'Anonymous',
          email: u.email,
          image: u.image,
          status: 'Offline', // Default status - could be enhanced with real-time status
        }));
        setFriends(usersList);
        setFriendsLoading(false);
      } catch (err) {
        console.error('Failed to load users:', err);
        setFriendsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Attempt to dynamically import ./home (optional). If present, populate videos and helper.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import('./home');
        if (!mounted) return;
        const modVideos = mod.VIDEOS || (mod.default && mod.default.VIDEOS) || DEFAULT_VIDEOS;
        setVideos(modVideos);
        const gv = mod.getVideoById || (mod.default && mod.default.getVideoById) || ((id) => modVideos.find((v) => v && (v.id === id || v.id == id)) || null);
        setGetVideoByIdFunc(() => gv);
      } catch (e) {
        // optional module not present — keep defaults
        // console.warn('Optional home module not available', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggleFriend = (id) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id]
    );
  };

  // Try to resolve video info from potential sources (home.jsx may store selection in localStorage or a global)
  const getVideoInfo = (id) => {
    try {
      // Try to read from localStorage (home.jsx might store selected video data there)
      const stored = localStorage.getItem('selectedVideo');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.id === id || parsed.id == id)) return parsed;
      }

      // Try a global fallback that some apps use
      if (window && window.__HOME_SELECTED_VIDEO__) {
        const g = window.__HOME_SELECTED_VIDEO__;
        if (g.id === id || g.id == id) return g;
      }

      // Fallback to shared videos (from dynamic load) if available
      const fallback = (typeof getVideoByIdFunc === 'function' && getVideoByIdFunc(id)) || (videos.find((v) => v.id === id || v.id == id) || null);
      return fallback || null;
    } catch (err) {
      console.error('getVideoInfo error:', err);
      setErrorMessage('Failed to read video information.');
      return null;
    }
  };

  // Navigate to the videoplayer route and pass video info via query params
  const navigateToVideo = (video) => {
    try {
      if (!video || !video.id) {
        setErrorMessage('Invalid video selected.');
        return;
      }

      // Build a URL with safe encoded params; videoplayer.jsx should read these
      const params = new URLSearchParams();
      params.set('id', String(video.id));
      if (video.title) params.set('title', video.title);
      if (video.channel) params.set('channel', video.channel);
      if (video.subtitle) params.set('subtitle', video.subtitle);

      // Clear any previous error before navigation
      setErrorMessage(null);

      // Use React Router navigate instead of window.location.assign
      const url = `/videoplayer?${params.toString()}`;
      navigate(url);
    } catch (err) {
      console.error('navigateToVideo error:', err);
      setErrorMessage('Failed to open video player.');
    }
  };

  const handleVideoSelect = (id) => {
    try {
      const video = getVideoInfo(id);
      if (!video) {
        setErrorMessage('Selected video could not be found.');
        return;
      }
      navigateToVideo(video);
    } catch (err) {
      console.error('handleVideoSelect error:', err);
      setErrorMessage('An unexpected error occurred while selecting the video.');
    }
  };

  // Exit should return to the previous page (e.g., videoplayer if opened from there)
  const handleExitClick = () => {
    try {
      navigate(-1);
    } catch (err) {
      console.error('handleExitClick error:', err);
      setErrorMessage('Could not navigate back.');
    }
  };

  const selectedFriendsCount = selectedFriends.length;
  const isCreateButtonEnabled = selectedFriendsCount > 0;

  // Logic for changing button text based on the mode
  const actionButtonText = watchTimeMode === 'schedule'
    ? getTranslation('Schedule Watch Party', selectedLanguage)
    : getTranslation('Create & Start Party', selectedLanguage);

  return (
    <ErrorBoundary>
      <SearchProvider>
        {/* Outer container for full-page white background */}
        <div className="min-h-screen bg-white font-sans">
          {/* Inner container for max-width on larger screens (but still full width on mobile) */}
          <div className="w-full bg-white max-w-4xl mx-auto rounded-none sm:rounded-3xl shadow-none sm:shadow-2xl overflow-hidden min-h-screen sm:min-h-0">
            {/* Header */}
            <div
              className="p-6 border-b border-gray-200 flex justify-between items-start"
              style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}
            >
              <div className="flex items-center">
                <div className="relative">
                  <div className="p-3 bg-violet-100 rounded-full">
                    <Users className="w-6 h-6 text-violet-500" />
                  </div>
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-violet-500 rounded-full border-2 border-white" />
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-800">{getTranslation('Watch Together', selectedLanguage)}</h1>
                  <p className="text-sm text-gray-500">{getTranslation('Synchronized viewing experience', selectedLanguage)}</p>
                </div>
              </div>
              <button onClick={() => handleExitClick()} className="text-gray-400 hover:text-gray-600 transition duration-150">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="p-6 sm:p-8">
              {errorMessage && (
                <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700">
                  <strong>{getTranslation('Error', selectedLanguage)}:</strong> {getTranslation(errorMessage, selectedLanguage)}
                </div>
              )}
              <WatchPartyIcon selectedLanguage={selectedLanguage} />

              {/* Steps Container */}
              <div className="mt-4 space-y-6">
                <VideoSelection onVideoSelect={handleVideoSelect} videos={videos} selectedLanguage={selectedLanguage} />
                <InviteFriends
                  selectedFriends={selectedFriends}
                  toggleFriend={toggleFriend}
                  selectedFriendsCount={selectedFriendsCount}
                  friends={friends}
                  searchQuery={friendSearchQuery}
                  setSearchQuery={setFriendSearchQuery}
                  selectedLanguage={selectedLanguage}
                />
                {/* Pass the mode state and setter to WhenToWatch */}
                <WhenToWatch
                  watchTimeMode={watchTimeMode}
                  setWatchTimeMode={setWatchTimeMode}
                  selectedLanguage={selectedLanguage}
                />
              </div>

              {/* Footer: Create Button */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <button
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-4 text-white font-semibold rounded-xl shadow-lg transition duration-200 transform ${isCreateButtonEnabled
                      ? 'bg-violet-600 hover:bg-violet-700 active:scale-[0.99] shadow-violet-300/50'
                      : 'bg-violet-300 cursor-not-allowed shadow-none'
                    }`}
                  disabled={!isCreateButtonEnabled}
                  onClick={() => {
                    if (isCreateButtonEnabled) {
                      console.log(`Action: ${actionButtonText} with friends:`, selectedFriends);
                    }
                  }}
                >
                  <Users className="w-5 h-5" />
                  {/* Use dynamic button text */}
                  <span>{actionButtonText}</span>
                </button>
                <p
                  className={`text-center mt-3 text-sm transition-opacity duration-200 ${isCreateButtonEnabled
                      ? 'opacity-0 h-0'
                      : 'text-red-500 opacity-100'
                    }`}
                >
                  {getTranslation('Please select at least one friend to continue', selectedLanguage)}
                </p>
              </div>

              {/* How it works section */}
              <div className="mt-6 p-4 bg-violet-50 rounded-xl border border-violet-200">
                <p className="font-semibold text-gray-800 mb-2">{getTranslation('How it works', selectedLanguage)}</p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li className="flex items-start">
                    <span className="text-violet-600 mr-2">•</span>
                    <span>{getTranslation('Everyone sees the same video at the same time', selectedLanguage)}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-violet-600 mr-2">•</span>
                    <span>{getTranslation('When anyone pauses, plays, or seeks - everyone syncs', selectedLanguage)}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-violet-600 mr-2">•</span>
                    <span>{getTranslation('Host has full control over playback', selectedLanguage)}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </SearchProvider>
    </ErrorBoundary>
  );
};

export default App;
