import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import * as eventBus from './eventbus.js';
import React, { useState, useEffect, useTransition, Suspense, lazy } from 'react';
import PageLoadingSkeleton from './PageLoadingSkeleton.jsx';
import LaunchScreen from './LaunchScreen.jsx';
import { LanguageProvider } from './LanguageContext.jsx';

// Lazy load all page components for faster initial load
const Home = lazy(() => import('./home.jsx'));
const Ideas = lazy(() => import('./ideas.jsx'));
const Requests = lazy(() => import('./requests.jsx'));
const Notifications = lazy(() => import('./notifications.jsx'));
const More = lazy(() => import('./more.jsx'));
const WatchHistory = lazy(() => import('./watchhistory.jsx'));
const WatchTogether = lazy(() => import('./watchtogether.jsx'));
const Marketplace = lazy(() => import('./Marketplace.jsx'));
const Sponsorship = lazy(() => import('./sponsorship.jsx'));
const Subscriptions = lazy(() => import('./subscriptions.jsx'));
const Videoplayer = lazy(() => import('./Videoplayer.jsx'));
const AdvertiseWithUs = lazy(() => import('./advertisewithus.jsx'));
const CreatorDashboard = lazy(() => import('./creatordashboard.jsx'));
const CreatorProfile = lazy(() => import('./creatorprofile.jsx'));
const UserProfile = lazy(() => import('./userprofile.jsx'));
const Settings = lazy(() => import('./settings.jsx'));
const LikedVideos = lazy(() => import('./likedvideos.jsx'));
const Bookmarks = lazy(() => import('./bookmarks.jsx'));
const Playlist = lazy(() => import('./playlists.jsx'));
const Referrals = lazy(() => import('./referrals.jsx'));
const Policies = lazy(() => import('./policies.jsx'));
const StaffDashboard = lazy(() => import('./StaffDashboard.jsx'));
const SupportPage = lazy(() => import('./SupportPage.jsx'));
const JoinReferral = lazy(() => import('./JoinReferral.jsx'));

/** Redirect /share/video/:id deep links to the videoplayer */
function ShareVideoRedirect() {
  const location = useLocation();
  const { videoId } = React.useMemo(() => {
    // Extract videoId from URL path (works for https:// and custom schemes)
    const path = window.location.pathname || location.pathname;
    const parts = path.split('/');
    const idx = parts.indexOf('video');
    
    let id = idx >= 0 && parts[idx + 1] ? decodeURIComponent(parts[idx + 1]) : null;
    
    // Fallback: check query params if path failed
    if (!id) {
      const params = new URLSearchParams(window.location.search);
      id = params.get('videoId') || params.get('id');
    }
    
    return { videoId: id };
  }, [location.pathname]);

  if (videoId) {
    return <Navigate to={`/videoplayer?id=${encodeURIComponent(videoId)}`} replace />;
  }
  return <Navigate to="/home" replace />;
}

const GlobalToast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => onClose(), 3800);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div
      className="fixed left-1/2 transform -translate-x-1/2 z-[200] w-full max-w-md mx-auto px-4"
      style={{ top: 'calc(12px + env(safe-area-inset-top, 0px))' }}
    >
      <div className="flex items-start bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 px-4 py-3">
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900">{toast.title}</div>
          {toast.subtitle && (
            <div className="text-xs text-gray-600 mt-0.5">{toast.subtitle}</div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 ml-3 text-sm"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Main footer tab switcher component
function FooterTabSwitcher() {
  const [activeTab, setActiveTab] = useState('home');
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL path or window global
  useEffect(() => {
    const path = location.pathname.replace('/', '');
    const mainTabs = ['home', 'ideas', 'requests', 'more'];
    if (mainTabs.includes(path)) {
      setActiveTab(path);
    } else if (path === '' || path === 'home.jsx') {
      setActiveTab('home');
    }
  }, [location.pathname]);

  // Store setActiveTab in window for external access (footer buttons)
  // This allows footer components to trigger tab switches instantly
  useEffect(() => {
    window.setFooterTab = (tab) => {
      setActiveTab(tab);
      // Store globally for SharedBottomBar sync
      window.currentFooterTab = tab;
      // Dispatch event to notify all SharedBottomBar instances
      window.dispatchEvent(new CustomEvent('footerTabChanged', { detail: { tab } }));
    };
    // Sync back if window.currentFooterTab was set (for footer components)
    if (window.currentFooterTab && window.currentFooterTab !== activeTab) {
      setActiveTab(window.currentFooterTab);
    }
    return () => {
      // Don't delete - footer components need this
    };
  }, [activeTab]);

  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      {/* Main tab content - switched based on activeTab */}
      {/* Components remain mounted for instant switching */}
      <div style={{ display: activeTab === 'home' ? 'block' : 'none', position: activeTab === 'home' ? 'relative' : 'absolute', visibility: activeTab === 'home' ? 'visible' : 'hidden' }}>
        <Home />
      </div>
      <div style={{ display: activeTab === 'ideas' ? 'block' : 'none', position: activeTab === 'ideas' ? 'relative' : 'absolute', visibility: activeTab === 'ideas' ? 'visible' : 'hidden' }}>
        <Ideas />
      </div>
      <div style={{ display: activeTab === 'requests' ? 'block' : 'none', position: activeTab === 'requests' ? 'relative' : 'absolute', visibility: activeTab === 'requests' ? 'visible' : 'hidden' }}>
        <Requests />
      </div>
      <div style={{ display: activeTab === 'more' ? 'block' : 'none', position: activeTab === 'more' ? 'relative' : 'absolute', visibility: activeTab === 'more' ? 'visible' : 'hidden' }}>
        <More />
      </div>
    </Suspense>
  );
}

function App() {
  const [overrideView, setOverrideView] = useState(null);
  const [overridePayload, setOverridePayload] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [showLaunchScreen, setShowLaunchScreen] = useState(true);
  const [globalToast, setGlobalToast] = useState(null);

  // Store launch screen state in window so FAB can access it
  useEffect(() => {
    window.showLaunchScreen = showLaunchScreen;
  }, [showLaunchScreen]);

  useEffect(() => {
    window.showToast = (payload) => {
      if (!payload) return;
      setGlobalToast({
        title: payload.title || 'Notification',
        subtitle: payload.subtitle || ''
      });
    };
    return () => {
      try { delete window.showToast; } catch (e) { }
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.removeItem('regaarder_push_enabled');
      localStorage.removeItem('regaarder_push_token');
      localStorage.removeItem('regaarder_push_history');
    } catch (e) { }
  }, []);

  useEffect(() => {
    const off = eventBus.on('switchToHomeOnly', (data) => {
      startTransition(() => {
        setOverrideView('home');
        setOverridePayload(data || null);
      });
    });
    const off2 = eventBus.on('clearOverride', () => {
      startTransition(() => {
        setOverrideView(null);
        setOverridePayload(null);
      });
    });
    return () => { try { off(); } catch (e) {} try { off2(); } catch (e) {} };
  }, []);

  // Handle payment success/failure callback from PayPal
  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const paymentSuccess = params.get('payment_success');
        const paymentFailed = params.get('payment_failed');
        
        const authToken = localStorage.getItem('authToken');
        if (!authToken) return;

        // Get backend URL
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const backendUrl = window.__BACKEND_URL__ || 'https://pwin.onrender.com';

        // Get pending payment session
        const pendingSession = localStorage.getItem('pending_payment_session');
        if (!pendingSession) return;

        const session = JSON.parse(pendingSession);
        const sessionId = session.sessionId;

        // Handle payment success
        if (paymentSuccess === 'true') {
          console.log('🟢 Processing payment success for session:', sessionId);
          
          try {
            const response = await fetch(`${backendUrl}/payment/success`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify({
                sessionId: sessionId,
                transactionId: params.get('transaction_id') || `paypal_${Date.now()}`
              })
            });

            if (response.ok) {
              const data = await response.json();
              console.log('✅ Payment processed successfully:', data);
              
              // Clear payment session and show success
              localStorage.removeItem('pending_payment_session');
              
              // Show success toast/notification
              if (window.showToast) {
                window.showToast({
                  title: 'Payment Successful! 🎉',
                  subtitle: `You now have access to ${session.tier} benefits!`
                });
              }

              // Clean URL
              const url = new URL(window.location.href);
              url.searchParams.delete('payment_success');
              url.searchParams.delete('transaction_id');
              window.history.replaceState({}, '', url);

              // Redirect to subscriptions page to show active subscription
              setTimeout(() => {
                window.location.href = '/subscriptions';
              }, 1500);
            } else {
              throw new Error('Payment success callback failed');
            }
          } catch (error) {
            console.error('❌ Payment success processing error:', error);
            // Still clear the URL even if callback fails
            const url = new URL(window.location.href);
            url.searchParams.delete('payment_success');
            window.history.replaceState({}, '', url);
          }
        }

        // Handle payment failure
        if (paymentFailed === 'true') {
          console.log('❌ Processing payment failure for session:', sessionId);
          
          try {
            await fetch(`${backendUrl}/payment/failure`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify({
                sessionId: sessionId,
                reason: params.get('failure_reason') || 'User cancelled payment'
              })
            });
          } catch (error) {
            console.error('Payment failure logging error:', error);
          }

          // Show failure message
          if (window.showToast) {
            window.showToast({
              title: 'Payment Cancelled',
              subtitle: 'Your payment was not completed. Please try again.'
            });
          }

          // Clean URL
          const url = new URL(window.location.href);
          url.searchParams.delete('payment_failed');
          url.searchParams.delete('failure_reason');
          window.history.replaceState({}, '', url);

          // Remove pending session
          localStorage.removeItem('pending_payment_session');
        }
      } catch (error) {
        console.error('Payment callback handling error:', error);
      }
    };

    // Run callback handler on component mount and URL change
    handlePaymentCallback();
  }, []);

  return (
    <LanguageProvider>
      <BrowserRouter>
        {showLaunchScreen && (
          <LaunchScreen onLoadComplete={() => setShowLaunchScreen(false)} />
        )}
        <GlobalToast toast={globalToast} onClose={() => setGlobalToast(null)} />
        {isPending ? (
          <PageLoadingSkeleton />
        ) : overrideView === 'home' ? (
          <Home overrideMiniPlayerData={overridePayload} />
        ) : (
        <Suspense fallback={<PageLoadingSkeleton />}>
        <Routes>
          {/* Main footer tabs - use tab switcher for instant switching */}
          <Route path="/" element={<FooterTabSwitcher />} />
          <Route path="/home" element={<FooterTabSwitcher />} />
          <Route path="/home.jsx" element={<FooterTabSwitcher />} />
          <Route path="/ideas" element={<FooterTabSwitcher />} />
          <Route path="/ideas.jsx" element={<FooterTabSwitcher />} />
          <Route path="/requests" element={<FooterTabSwitcher />} />
          <Route path="/requests.jsx" element={<FooterTabSwitcher />} />
          <Route path="/more" element={<FooterTabSwitcher />} />
          <Route path="/more.jsx" element={<FooterTabSwitcher />} />
          
          {/* Other routes - keep normal routing */}
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/watchhistory" element={<WatchHistory />} />
          <Route path="/watchtogether" element={<WatchTogether />} />
          <Route path="/marketplace" element={<Navigate to="/home" replace />} />
          <Route path="/sponsorship" element={<Sponsorship />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/videoplayer" element={<Videoplayer />} />
          <Route path="/share/video/:videoId" element={<ShareVideoRedirect />} />
          <Route path="/advertisewithus" element={<AdvertiseWithUs />} />
          <Route path="/creatordashboard" element={<CreatorDashboard />} />
          <Route path="/creatorprofile" element={<CreatorProfile />} />
          <Route path="/:handle" element={<CreatorProfile />} />
          <Route path="/userprofile" element={<UserProfile />} />
          
          {/* Additional sidebar routes - they can redirect to home or show placeholder */}
          <Route path="/yourprofile" element={<UserProfile />} />
          <Route path="/yourrequests" element={<Requests />} />
          <Route path="/trackyourrequests" element={<Requests />} />
          <Route path="/referralrewards" element={<Referrals />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/join" element={<JoinReferral />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/likedvideos" element={<LikedVideos />} />
          <Route path="/following" element={<Home />} />
          <Route path="/playlist" element={<Playlist />} />
          <Route path="/myfolders" element={<Navigate to="/playlist" replace />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/upgradetopremium" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Fallback routes for .jsx extensions (redirects) */}
          <Route path="/notifications.jsx" element={<Navigate to="/notifications" replace />} />
          <Route path="/watchhistory.jsx" element={<Navigate to="/watchhistory" replace />} />
          <Route path="/watchtogether.jsx" element={<Navigate to="/watchtogether" replace />} />
          <Route path="/marketplace.jsx" element={<Navigate to="/home" replace />} />
          <Route path="/Marketplace.jsx" element={<Navigate to="/home" replace />} />
          <Route path="/sponsorship.jsx" element={<Navigate to="/sponsorship" replace />} />
          <Route path="/Sponsorship.jsx" element={<Navigate to="/sponsorship" replace />} />
          <Route path="/videoplayer.jsx" element={<Navigate to="/videoplayer" replace />} />
          <Route path="/Videoplayer.jsx" element={<Navigate to="/videoplayer" replace />} />
          <Route path="/advertisewithus.jsx" element={<Navigate to="/advertisewithus" replace />} />
          <Route path="/creatordashboard.jsx" element={<Navigate to="/creatordashboard" replace />} />
          <Route path="/creatorprofile.jsx" element={<Navigate to="/creatorprofile" replace />} />
          <Route path="/userprofile.jsx" element={<Navigate to="/userprofile" replace />} />
        </Routes>
      </Suspense>
      )
      }
    </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
