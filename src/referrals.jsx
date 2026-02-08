import { useState, useRef, useEffect } from 'react';
import { Users, Gift, Zap, TrendingUp, Lock, CheckCircle2, Copy, Share2, X, ChevronLeft } from 'lucide-react';
import { getTranslation } from './translations.js';
import { WEB_URL } from './config.js';
import SharedBottomBar from './components/SharedBottomBar.jsx';

const getCssVar = (name, fallback) => {
    try { 
        const v = getComputedStyle(document.documentElement).getPropertyValue(name); 
        return v ? v.trim() : fallback; 
    } catch (e) { 
        return fallback; 
    }
};

const ACCENT_COLOR = getCssVar('--color-accent', '#CA8A04');
const HIGHLIGHT_COLOR = getCssVar('--color-accent-soft', 'rgba(202, 138, 4, 0.12)');
const ICON_BACKGROUND = getCssVar('--color-gold-light-bg', 'rgba(202, 138, 4, 0.1)');

const Referrals = () => {
    const [selectedLanguage, setSelectedLanguage] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('regaarder_language') : 'English') || 'English');
    const [showTypeModal, setShowTypeModal] = useState(true); // Show type selection modal on load
    const [showBenefitsModal, setShowBenefitsModal] = useState(null); // 'user' or 'creator' or null
    const [referralCount, setReferralCount] = useState(0);
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleLanguageChange = () => {
            setSelectedLanguage(localStorage.getItem('regaarder_language') || 'English');
        };
        window.addEventListener('storage', handleLanguageChange);
        return () => window.removeEventListener('storage', handleLanguageChange);
    }, []);

    const t = (key) => getTranslation(key, selectedLanguage);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const token = localStorage.getItem('regaarder_token');
                if (!token) {
                    setLoading(false);
                    return;
                }

                const BACKEND = (window && window.__BACKEND_URL__) || 'https://pwin.onrender.com';
                const response = await fetch(`${BACKEND}/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setUserInfo(data.user);
                    setReferralCount(data.user.referralCount || 0);
                }
            } catch (err) {
                console.error('Error fetching user info:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserInfo();
    }, []);

    const getReferralLink = () => {
        if (!userInfo) return '';
        return `${WEB_URL}/join?code=${userInfo.referralCode || userInfo.id}`;
    };

    const getReferralCode = () => {
        return userInfo?.referralCode || '';
    };

    const copyCode = () => {
        const code = getReferralCode();
        navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const copyLink = () => {
        const link = getReferralLink();
        navigator.clipboard.writeText(link);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                {t('Loading...')}
            </div>
        );
    }

    return (
        <div className="min-h-screen text-gray-900" style={{ background: 'linear-gradient(135deg, rgba(var(--color-gold-rgb), 0.03) 0%, white 50%)' }}>
            <div className="max-w-md mx-auto px-4 pt-6 pb-28 relative">
                
                {/* Back Button */}
                <button
                    onClick={() => window.setFooterTab('Home')}
                    className="absolute top-6 left-4 p-2 hover:bg-gray-100 rounded-full transition"
                >
                    <ChevronLeft className="w-6 h-6" style={{ color: ACCENT_COLOR }} />
                </button>

                {/* Header */}
                <div className="mb-8 pt-2 w-full">
                    <div className="flex flex-col items-center justify-center">
                        <div className="inline-flex items-center justify-center p-3 rounded-full mb-3" style={{ backgroundColor: HIGHLIGHT_COLOR }}>
                            <Users className="w-6 h-6" style={{ color: ACCENT_COLOR }} />
                        </div>
                        <h1 className="text-2xl font-bold mb-1">{t('Get Rewarded for Sharing')}</h1>
                        <p className="text-gray-500 text-sm max-w-xs">{t('Invite friends and unlock exclusive benefits')}</p>
                    </div>
                </div>

                {/* Referral Stats Card */}
                <div className="rounded-2xl border-2 p-6 mb-8" style={{ borderColor: ACCENT_COLOR, backgroundColor: '#FAFAF8' }}>
                    <div className="text-center mb-6">
                        <p className="text-gray-600 text-sm mb-1">{t('Friends invited')}</p>
                        <p className="text-4xl font-bold" style={{ color: ACCENT_COLOR }}>{referralCount}</p>
                    </div>

                    {/* Referral Code Display */}
                    <div className="mb-4">
                        <p className="text-xs text-gray-600 mb-2 font-semibold">{t('Your Referral Code')}</p>
                        <div className="p-4 bg-white rounded-lg border-2 flex items-center space-x-3" style={{ borderColor: ACCENT_COLOR }}>
                            <div className="flex-1">
                                <p className="text-lg font-bold tracking-widest" style={{ color: ACCENT_COLOR }}>
                                    {getReferralCode() || '—'}
                                </p>
                            </div>
                            <button
                                onClick={copyCode}
                                className="p-2 hover:bg-gray-100 rounded transition flex-shrink-0"
                                title={t('Copy code')}
                                disabled={!getReferralCode()}
                            >
                                {copiedCode ? (
                                    <CheckCircle2 className="w-5 h-5" style={{ color: ACCENT_COLOR }} />
                                ) : (
                                    <Copy className="w-5 h-5 text-gray-600" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Referral Link Display */}
                    <div className="mb-6">
                        <p className="text-xs text-gray-600 mb-2 font-semibold">{t('Or share your link')}</p>
                        <div className="p-4 bg-white rounded-lg border border-gray-200 flex items-center space-x-2 text-sm">
                            <span className="text-gray-600 flex-1 truncate text-xs">{getReferralLink()}</span>
                            <button
                                onClick={copyLink}
                                className="p-2 hover:bg-gray-100 rounded transition flex-shrink-0"
                                title={t('Copy link')}
                            >
                                {copiedLink ? (
                                    <CheckCircle2 className="w-5 h-5" style={{ color: ACCENT_COLOR }} />
                                ) : (
                                    <Copy className="w-5 h-5 text-gray-600" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Share Button */}
                    <button
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: t('Get Rewarded for Sharing'),
                                    text: `Join with my referral code: ${getReferralCode()}`,
                                    url: getReferralLink(),
                                });
                            } else {
                                copyLink();
                            }
                        }}
                        className="w-full py-3 rounded-lg font-semibold text-white transition-all active:scale-95 flex items-center justify-center space-x-2"
                        style={{ backgroundColor: ACCENT_COLOR }}
                    >
                        <Share2 className="w-5 h-5" />
                        <span>{t('Share Referral Link')}</span>
                    </button>
                </div>

                {/* How It Works Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-6 text-center">{t('How it works')}</h2>
                    <div className="space-y-4">
                        {[
                            { num: 1, title: t('Share your link'), desc: t('Copy and send to friends via any platform') },
                            { num: 2, title: t('They sign up'), desc: t('Your friend creates an account using your link') },
                            { num: 3, title: t('Earn rewards'), desc: t('Unlock benefits as you reach each tier') },
                            { num: 4, title: t('Rewards activate instantly'), desc: t('Use your new benefits right away') },
                        ].map((step, idx) => (
                            <div key={idx} className="flex space-x-4">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white"
                                    style={{ backgroundColor: ACCENT_COLOR }}
                                >
                                    {step.num}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 text-sm">{step.title}</h3>
                                    <p className="text-xs text-gray-600 mt-1">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Type Selection Modal */}
            {showTypeModal && (
                <TypeSelectionModal
                    onUserClick={() => {
                        setShowTypeModal(false);
                        setShowBenefitsModal('user');
                    }}
                    onCreatorClick={() => {
                        setShowTypeModal(false);
                        setShowBenefitsModal('creator');
                    }}
                    onClose={() => setShowTypeModal(false)}
                    selectedLanguage={selectedLanguage}
                />
            )}

            {/* Benefits Modal */}
            {showBenefitsModal && (
                <BenefitsModal
                    type={showBenefitsModal}
                    onClose={() => setShowBenefitsModal(null)}
                    selectedLanguage={selectedLanguage}
                />
            )}

            {/* Shared Bottom Navigation Bar */}
            <SharedBottomBar selectedLanguage={selectedLanguage} />
        </div>
    );
};

// Type Selection Modal Component
const TypeSelectionModal = ({ onUserClick, onCreatorClick, onClose, selectedLanguage }) => {
    const t = (key) => getTranslation(key, selectedLanguage);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white w-full max-w-md rounded-3xl p-8 mx-4 relative">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold">{t('Earn Rewards')}</h2>
                    <p className="text-gray-600 text-sm mt-2">{t('Invite friends and unlock exclusive benefits')}</p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={onUserClick}
                        className="w-full py-4 px-4 rounded-2xl font-semibold text-white transition-all active:scale-95 text-lg"
                        style={{ backgroundColor: ACCENT_COLOR }}
                    >
                        {t('Refer Users')}
                    </button>
                    <button
                        onClick={onCreatorClick}
                        className="w-full py-4 px-4 rounded-2xl font-semibold transition-all active:scale-95 text-lg"
                        style={{ 
                            backgroundColor: '#F3F4F6',
                            color: ACCENT_COLOR,
                            border: `2px solid ${ACCENT_COLOR}`
                        }}
                    >
                        {t('Refer Creators')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Benefits Modal Component
const BenefitsModal = ({ type, onClose, selectedLanguage }) => {
    const t = (key) => getTranslation(key, selectedLanguage);

    const title = type === 'user' ? t('For Users') : t('For Creators');

    const subtitleContent = type === 'user' 
        ? (
            <p className="text-gray-600 mb-8 text-center text-sm mt-2">
                🎁 Invite a <strong>friend</strong> and <strong>both of you receive 5 free requests</strong>. 🎁
            </p>
          )
        : (
            <p className="text-gray-600 mb-8 text-center text-sm mt-2">
                🎁 Give a <strong>creator</strong> you know a limited opportunity to <strong>earn up to 15% more on Regaarder for 30 days</strong>. 🎁
            </p>
          );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white w-full max-w-md rounded-3xl p-8 mx-4 max-h-[80vh] overflow-y-auto relative">
                <h2 className="text-2xl font-bold text-center">{title}</h2>

                {subtitleContent}

                <button
                    onClick={onClose}
                    className="w-full py-3 rounded-lg font-semibold text-white transition-all active:scale-95"
                    style={{ backgroundColor: ACCENT_COLOR }}
                >
                    {t('Got it')}
                </button>
            </div>
        </div>
    );
};

export default Referrals;
