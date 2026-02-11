import React, { useState, useRef, useEffect } from 'react';
import { Home, FileText, Pencil, MoreHorizontal, Crown, Sparkles, ArrowRight, Check } from 'lucide-react';
import { getTranslation } from './translations.js';
import SharedBottomBar from './components/SharedBottomBar.jsx';

const getCssVar = (name, fallback) => {
    try { 
        const v = getComputedStyle(document.documentElement).getPropertyValue(name); 
        return v ? v.trim() : fallback; 
    } catch (e) { 
        return fallback; 
    }
};

const getAccentColor = () => {
    try {
        return getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#9333ea';
    } catch (e) {
        return '#9333ea';
    }
};

const ACCENT_COLOR = getAccentColor();
const HIGHLIGHT_COLOR = `rgba(${parseInt(ACCENT_COLOR.slice(1, 3), 16)}, ${parseInt(ACCENT_COLOR.slice(3, 5), 16)}, ${parseInt(ACCENT_COLOR.slice(5, 7), 16)}, 0.12)`;
const ICON_BACKGROUND = `rgba(${parseInt(ACCENT_COLOR.slice(1, 3), 16)}, ${parseInt(ACCENT_COLOR.slice(3, 5), 16)}, ${parseInt(ACCENT_COLOR.slice(5, 7), 16)}, 0.1)`;

// Bottom navigation bar component - removed, now using SharedBottomBar

const Subscriptions = () => {
    const [currentPlan, setCurrentPlan] = useState(null);
    const [planDetails, setPlanDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userPlan, setUserPlan] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('regaarder_language') : 'English') || 'English');

    useEffect(() => {
        const handleLanguageChange = () => {
            setSelectedLanguage(localStorage.getItem('regaarder_language') || 'English');
        };
        window.addEventListener('storage', handleLanguageChange);
        return () => window.removeEventListener('storage', handleLanguageChange);
    }, []);

    const t = (key) => getTranslation(key, selectedLanguage);

    useEffect(() => {
        // Fetch current user plan from backend
        const fetchUserPlan = async () => {
            try {
                const token = localStorage.getItem('regaarder_token') || localStorage.getItem('authToken');
                if (!token) {
                    setLoading(false);
                    return;
                }

                // Get backend URL dynamically
                const protocol = window.location.protocol;
                const hostname = window.location.hostname;
                const backendUrl = window.__BACKEND_URL__ || 'https://pwin.onrender.com';

                // Fetch subscription status from payment endpoint
                const response = await fetch(`${backendUrl}/payment/subscription`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const subscription = data.subscription;
                    
                    if (subscription && subscription.active && subscription.tier) {
                        setCurrentPlan(subscription.tier);
                        setPlanDetails(subscription);
                    }
                    
                    // Also try to fetch from user endpoint for compatibility
                    const userResponse = await fetch(`${backendUrl}/users/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        setUserPlan(userData.user);
                        if (userData.user.userPlan && !subscription?.tier) {
                            setCurrentPlan(userData.user.userPlan);
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching subscription:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserPlan();
    }, []);

    const handleUpgrade = () => {
        try {
            window.location.href = '/sponsorship.jsx';
        } catch (e) {
            console.warn('Navigation failed', e);
        }
    };

    // Define plan details for display
    const planDetailsMap = {
        'starter': {
            name: t('Starter (Free)'),
            price: '$0/month',
            color: '#6B7280',
            features: [
                t('1 active free request at a time'),
                t('Max 3 paid requests active at a time'),
                t('Max $150 total value for paid requests'),
                t('Invite contributors (viral growth)'),
                t('Maximum video quality: 360p')
            ]
        },
        'pro': {
            name: t('Pro'),
            price: '$8.24/month',
            color: ACCENT_COLOR,
            badge: t('FLASH DEAL -45% OFF'),
            features: [
                t('Unlimited free requests (with decay)'),
                t('Up to 5 active paid requests'),
                t('No hard cap on request value'),
                t('Target specific creators'),
                t('Boosting available'),
                t('Contributor pooling enabled'),
                t('Priority visibility (slower decay)'),
                t('Repost faster after no response'),
                t('Priority creator matching'),
                t('No ads'),
                t('Faster request response')
            ]
        },
        'starterCreator': {
            name: t('Starter Creator'),
            price: '$0/month',
            color: '#10B981',
            features: [
                t('Max 3 paid requests per day'),
                t('Daily paid value cap: $150–$200'),
                t('Unlimited free requests (optional)'),
                t('Standard visibility in feed'),
                t('Standard response window'),
                t('Creator dashboard & monetization')
            ]
        },
        'proCreator': {
            name: t('Pro Creator'),
            price: '$14.99/month',
            color: ACCENT_COLOR,
            badge: t('BEST VALUE'),
            features: [
                t('All in Starter Creator'),
                t('Up to 15 paid requests per day'),
                t('No daily value cap'),
                t('High-value requests unlocked'),
                t('Targeted requests with priority access'),
                t('Boosted requests with priority'),
                t('Queue management (accept/defer)'),
                t('Higher algorithmic trust weight'),
                t('Add Merch links & other links in video'),
                t('Direct access to sponsors'),
                t('Upload videos independently (no requests)'),
                t('Priority support'),
                t('Up to 80% revenue share')
            ]
        }
    };

    return (
        <div className="min-h-screen text-gray-900" style={{ background: 'linear-gradient(135deg, rgba(var(--color-gold-rgb), 0.03) 0%, white 50%)' }}>
            <div
                className="max-w-md mx-auto px-4 pb-28"
                style={{ paddingTop: 'calc(24px + env(safe-area-inset-top, 0px))' }}
            >

                {/* Ad Visibility Message Banner */}
                {(() => {
                    const userStr = localStorage.getItem('regaarder_user');
                    const user = userStr ? JSON.parse(userStr) : null;
                    const hasPaidPlan = user?.subscription && 
                                       user.subscription.tier && 
                                       user.subscription.tier !== 'free' && 
                                       user.subscription.tier !== 'Free' &&
                                       user.subscription.isActive !== false;
                    
                    const isPaidUser = hasPaidPlan;
                    const message = isPaidUser 
                        ? t('You\'re on a premium plan, no ads will be shown')
                        : t('Free tier account, ads will be shown');
                    const bgColor = isPaidUser ? 'bg-green-50' : 'bg-blue-50';
                    const borderColor = isPaidUser ? 'border-green-200' : 'border-blue-200';
                    const textColor = isPaidUser ? 'text-green-800' : 'text-blue-800';
                    const iconColor = isPaidUser ? 'text-green-600' : 'text-blue-600';
                    
                    return (
                        <div className={`mb-6 px-4 py-3 rounded-lg border ${bgColor} ${borderColor}`}>
                            <div className="flex items-start space-x-3">
                                <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
                                    {isPaidUser ? (
                                        <Check size={18} />
                                    ) : (
                                        <FileText size={18} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm font-medium ${textColor}`}>
                                        {message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {loading ? (
                    <div className="flex flex-col items-center justify-start text-center space-y-6 pt-8">
                        <div className="text-gray-500">Loading...</div>
                    </div>
                ) : currentPlan && planDetailsMap[currentPlan] ? (
                    // Display Current Plan
                    <div className="flex flex-col items-stretch text-center space-y-6 pt-8">
                        {(() => {
                            const plan = planDetailsMap[currentPlan];
                            const expiryDate = planDetails?.expiryDate ? new Date(planDetails.expiryDate) : null;
                            const daysRemaining = expiryDate ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
                            
                            return (
                                <>
                                    {/* Subscription Status Banner */}
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                        <div className="flex items-center justify-center space-x-2 mb-2">
                                            <Check className="w-5 h-5 text-green-600" />
                                            <h3 className="font-semibold text-green-800">{t('Active Subscription')}</h3>
                                        </div>
                                        {expiryDate && (
                                            <p className="text-sm text-green-700">
                                                {daysRemaining > 0 
                                                    ? t(`Renews in ${daysRemaining} days`)
                                                    : t('Renewing soon')}
                                            </p>
                                        )}
                                    </div>

                                    {/* Plan Card */}
                                    <div 
                                        className="rounded-2xl border-2 p-6 bg-white shadow-lg"
                                        style={{ borderColor: plan.color }}
                                    >
                                        {/* Badge */}
                                        {plan.badge && (
                                            <div 
                                                className="inline-block text-xs font-bold px-3 py-1.5 rounded-full text-white mb-4"
                                                style={{ backgroundColor: plan.color }}
                                            >
                                                {plan.badge}
                                            </div>
                                        )}

                                        {/* Plan Name */}
                                        <h2 className="text-2xl font-bold mb-2" style={{ color: plan.color }}>
                                            {plan.name}
                                        </h2>

                                        {/* Price */}
                                        <div className="text-3xl font-bold mb-6" style={{ color: plan.color }}>
                                            {plan.price}
                                        </div>

                                        {/* Features List */}
                                        <div className="text-left space-y-2 mb-6">
                                            {plan.features.map((feature, idx) => (
                                                <div key={idx} className="flex items-start space-x-3">
                                                    <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: plan.color }} />
                                                    <span className="text-sm text-gray-700">{feature}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Active Benefits Section */}
                                        {planDetails?.benefits && planDetails.benefits.length > 0 && (
                                            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                <h3 className="text-sm font-semibold text-blue-900 mb-3">{t('Your Active Benefits:')}</h3>
                                                <ul className="text-sm text-blue-800 space-y-1">
                                                    {planDetails.benefits.map((benefit, idx) => (
                                                        <li key={idx} className="flex items-start space-x-2">
                                                            <span className="text-blue-600 mt-1">✓</span>
                                                            <span>{benefit}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Manage Subscription CTA */}
                                        <button 
                                            onClick={handleUpgrade}
                                            className="w-full py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 mb-3"
                                            style={{ backgroundColor: plan.color }}
                                        >
                                            {t('Manage Subscription')}
                                        </button>

                                        {/* Cancel Option */}
                                        <button 
                                            onClick={async () => {
                                                if (confirm(t('Are you sure you want to cancel your subscription?'))) {
                                                    try {
                                                        const token = localStorage.getItem('authToken');
                                                        const protocol = window.location.protocol;
                                                        const hostname = window.location.hostname;
                                                        const backendUrl = window.__BACKEND_URL__ || 'https://pwin.onrender.com';
                                                        
                                                        const response = await fetch(`${backendUrl}/payment/subscription/cancel`, {
                                                            method: 'POST',
                                                            headers: {
                                                                'Authorization': `Bearer ${token}`,
                                                                'Content-Type': 'application/json'
                                                            }
                                                        });

                                                        if (response.ok) {
                                                            alert(t('Subscription cancelled successfully'));
                                                            window.location.reload();
                                                        }
                                                    } catch (err) {
                                                        console.error('Cancel subscription error:', err);
                                                        alert(t('Failed to cancel subscription'));
                                                    }
                                                }
                                            }}
                                            className="w-full py-2 rounded-xl text-gray-600 font-semibold transition-all hover:bg-gray-100 border border-gray-200"
                                        >
                                            {t('Cancel Subscription')}
                                        </button>
                                    </div>

                                    {/* Upgrade/Downgrade Info */}
                                    <div 
                                        className="p-4 rounded-xl text-sm"
                                        style={{ backgroundColor: HIGHLIGHT_COLOR }}
                                    >
                                        <p className="text-gray-700">
                                            {t('Want to upgrade or change your plan? Visit the upgrade page to explore all available plans.')}
                                        </p>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                ) : (
                    // Empty State
                    <div className="flex flex-col items-center text-center space-y-6 pt-8">
                        
                        {/* Icon with gradient background */}
                        <div 
                            className="w-24 h-24 rounded-2xl flex items-center justify-center"
                            style={{
                                background: `linear-gradient(135deg, ${HIGHLIGHT_COLOR} 0%, rgba(255,255,255,0.3) 100%)`,
                                boxShadow: '0 4px 12px rgba(203,138,0,0.1)'
                            }}
                        >
                            <Crown className="w-12 h-12" style={{ color: ACCENT_COLOR }} />
                        </div>
                        
                        {/* Main Empty State Text */}
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-gray-800">
                                {t('No Active Subscription')}
                            </h2>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                                {t('You haven\'t upgraded your plan yet. Unlock premium features and exclusive benefits!')}
                            </p>
                        </div>

                        {/* Benefits Preview */}
                        <div className="w-full max-w-sm space-y-3 pt-4">
                            <div className="flex items-start space-x-3 p-3 rounded-xl" style={{ backgroundColor: HIGHLIGHT_COLOR }}>
                                <div 
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: ICON_BACKGROUND }}
                                >
                                    <Sparkles className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-gray-800">{t('Premium Content')}</p>
                                    <p className="text-xs text-gray-500">{t('Access exclusive videos and features')}</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 p-3 rounded-xl" style={{ backgroundColor: HIGHLIGHT_COLOR }}>
                                <div 
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: ICON_BACKGROUND }}
                                >
                                    <Crown className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-gray-800">{t('Priority Support')}</p>
                                    <p className="text-xs text-gray-500">{t('Get help faster with 24/7 priority support')}</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 p-3 rounded-xl" style={{ backgroundColor: HIGHLIGHT_COLOR }}>
                                <div 
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: ICON_BACKGROUND }}
                                >
                                    <FileText className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-gray-800">{t('Unlimited Requests')}</p>
                                    <p className="text-xs text-gray-500">{t('Request as many videos as you want')}</p>
                                </div>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <div className="pt-6 w-full max-w-sm">
                            <button 
                                onClick={handleUpgrade}
                                className="w-full py-4 rounded-xl text-white font-semibold text-base transition-all hover:opacity-90 shadow-lg flex items-center justify-center space-x-2"
                                style={{ 
                                    backgroundColor: ACCENT_COLOR,
                                    boxShadow: `0 4px 12px rgba(203, 138, 0, 0.3)`
                                }}
                            >
                                <Crown className="w-5 h-5" />
                                <span>{t('Upgrade Your Plan')}</span>
                            </button>
                            
                            <p className="text-xs text-gray-400 mt-3">
                                {t('Start your premium journey today')}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Navigation Bar */}
            <SharedBottomBar selectedLanguage={localStorage.getItem('regaarder_language') || 'English'} />
        </div>
    );
};

export default Subscriptions;
