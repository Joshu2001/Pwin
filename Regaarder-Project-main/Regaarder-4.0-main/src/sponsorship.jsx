import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, FileText, Pencil, MoreHorizontal, Crown, ArrowLeft, ChevronRight, ChevronLeft, Shield, Lock, Gift, Star, CheckCircle2, X, Video, Users, TrendingDown, MonitorPlay, Zap, Eye, RotateCw, Sparkles, Ban, BarChart3, Clock, Target, Unlock, Percent, Share2, Headphones } from 'lucide-react';
import { getTranslation } from './translations.js';
import SharedBottomBar from './components/SharedBottomBar.jsx';
import { getBackendBaseUrl } from './config.js';
import { getSafeReturnBaseUrl, getSafeReturnPath, startPayPalCheckout } from './utils/paypalCheckout.js';

// Reuse the same accent/color tokens from advertisewithus.jsx
const getCssVar = (name, fallback) => {
    try { const v = getComputedStyle(document.documentElement).getPropertyValue(name); return v ? v.trim() : fallback; } catch (e) { return fallback; }
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

// Safe price formatting helper
const formatPrice = (monthly, billingPeriod = 'monthly', discount = 0.17) => {
    if (typeof monthly !== 'number' || Number.isNaN(monthly)) return '—';
    if (billingPeriod === 'daily') return `$${(monthly / 30).toFixed(2)}`;
    if (billingPeriod === 'monthly') return `$${monthly.toFixed(2)}`;
    const annual = monthly * 12 * (1 - discount);
    return `$${annual.toFixed(2)}`;
};

// Ala carte items (from provided images)
const alaCarteItems = [
    {
        title: 'Enhanced Video Quality',
        priceMonthly: 5.99,
        description: 'Unlock 2160p 4K video resolution for ultra-clear viewing'
    },
    {
        title: 'Get extra paid requests',
        priceMonthly: 4.99,
        description: 'Add 5 extra paid requests per day to your quota'
    },
    {
        title: 'Claim higher-value requests',
        priceMonthly: 7.99,
        description: 'Unlock ability to claim requests valued over $150'
    },
    {
        title: 'Priority request placement',
        priceMonthly: 5.99,
        description: 'Boost your requests to top of feed (no decay)'
    }
];

// Footer component - removed, now using SharedBottomBar

const PlanCard = ({ title, subtitle = null, priceMonthly, oldPriceMonthly, features = [], cta, themeColor = ACCENT_COLOR, badge = null, savingLabel = null, billingPeriod = 'monthly', annualDiscount = 0.17, onCtaClick = null }) => {
    const displayPrice = (monthly) => formatPrice(monthly, billingPeriod, annualDiscount);

    const periodLabel = billingPeriod === 'daily' ? '/dy' : billingPeriod === 'monthly' ? '/mo' : '/yr';

    return (
        <div className="rounded-3xl border p-8 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
            {/* Accent highlight on top */}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: themeColor }} />
            
            {badge && (
                <div className="absolute top-6 right-6">
                    <div className="text-xs font-bold px-3 py-1.5 rounded-full text-white" style={{ backgroundColor: themeColor }}>
                        {badge.label}
                    </div>
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
                {subtitle && (
                    <p className="text-sm text-gray-500 mb-3">{subtitle}</p>
                )}
                <div className="flex items-baseline space-x-2">
                    {oldPriceMonthly && (
                        <div className="text-lg text-gray-400 line-through">
                            {formatPrice(oldPriceMonthly, billingPeriod, annualDiscount)}
                        </div>
                    )}
                    <div className="text-4xl font-bold" style={{ color: themeColor }}>
                        {displayPrice(priceMonthly)}
                    </div>
                    <div className="text-gray-600 font-medium">{periodLabel}</div>
                </div>
                {savingLabel && (
                    <div className="mt-3 text-sm font-semibold" style={{ color: themeColor }}>
                        {savingLabel}
                    </div>
                )}
            </div>

            {/* Features list */}
            <div className="mb-8 pb-8 border-b border-gray-200">
                {features.map((f, i) => {
                    const isObject = typeof f === 'object' && f !== null;
                    const featureText = isObject ? f.text : f;
                    const Icon = isObject ? f.icon : null;
                    const isAllowed = isObject ? f.allowed !== false : true;
                    const section = isObject ? f.section : null;
                    const isBold = isObject ? f.bold : false;
                    const isSmall = isObject ? f.small : false;
                    const isSubtle = isObject ? f.subtle : false;
                    
                    // Skip section headers from being rendered as features
                    if (section === 'Limits' && isSmall) {
                        // Render limits as small grey text without icon
                        return (
                            <div key={i} className="text-xs text-gray-500 leading-relaxed mb-1">
                                • {featureText}
                            </div>
                        );
                    }
                    
                    if (section === 'Core Access' && isBold) {
                        // Render core access items with bullet, bold text, no icon
                        return (
                            <div key={i} className="flex items-start space-x-2 mb-2">
                                <span className="text-gray-900 font-semibold text-sm">📌</span>
                                <span className="text-gray-900 font-semibold text-sm leading-relaxed">{featureText}</span>
                            </div>
                        );
                    }
                    
                    // Regular features with icons (Capabilities, Visibility, Quality)
                    return (
                        <div key={i} className="flex items-start space-x-3 mb-3">
                            <div className="flex-shrink-0 pt-0.5">
                                {Icon ? (
                                    <Icon size={18} style={{ color: isSubtle ? '#D1D5DB' : themeColor, opacity: isSubtle ? 0.7 : 1 }} />
                                ) : (
                                    <svg className="w-4.5 h-4.5" style={{ color: themeColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span className={`text-sm leading-relaxed ${!isAllowed ? 'text-gray-400' : 'text-gray-700'}`}>
                                {featureText}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* CTA Button */}
            <button 
                onClick={() => onCtaClick && onCtaClick()} 
                className="w-full py-4 px-4 rounded-2xl text-white font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-base shadow-lg hover:shadow-xl overflow-hidden group relative"
                style={{ backgroundColor: themeColor }}
            >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-white" />
                <span className="relative">{cta}</span>
            </button>
        </div>
    );
};


const Sponsorships = () => {
    const navigate = useNavigate();
    const backendBase = getBackendBaseUrl();
    const sponsorCaptureHandledRef = useRef(false);
    // refs for scroll reveal
    const containerRef = useRef(null);
    const cardRefs = useRef([]);
    const [visibleIdx, setVisibleIdx] = useState(() => ({}));
    const [showAlaCarte, setShowAlaCarte] = useState(false);
    const [billingPeriod, setBillingPeriod] = useState('daily');
    const [selectedAlaCarte, setSelectedAlaCarte] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [processingSponsorshipPayment, setProcessingSponsorshipPayment] = useState(false);
    const [paypalSdkReady, setPaypalSdkReady] = useState(false);
    const [sponsorPaymentError, setSponsorPaymentError] = useState('');
    const [language, setLanguage] = useState(localStorage.getItem('regaarder_language') || 'English');
    const [planType, setPlanType] = useState(null); // 'user' or 'creator' - null means showing modal
    const [showPlanTypeModal, setShowPlanTypeModal] = useState(true); // Show modal on initial load
    const t = (key) => getTranslation(key, language);

    const getPlanUpgradeMeta = (plan) => {
        const isCreatorPlan = plan.type === 'creator';
        const normalizedTitle = String(plan.title || '').toLowerCase();
        const isStarter = normalizedTitle.includes('starter');
        const endpoint = isCreatorPlan ? '/creator-plan/upgrade' : '/subscription/upgrade';
        const planParam = isStarter ? 'starter' : 'pro';
        return { endpoint, planParam, planType: isCreatorPlan ? 'creator' : 'user' };
    };

    const startSponsorshipCheckout = async ({ amount, purchaseType, chargeMode, itemKey, itemTitle, upgradeMeta }) => {
        if (processingSponsorshipPayment) return;

        const token = localStorage.getItem('regaarder_token');
        if (!token) {
            setSponsorPaymentError('Please sign in to complete payment.');
            return;
        }

        if (!paypalSdkReady) {
            setSponsorPaymentError('PayPal is still loading. Please wait a moment and try again.');
            return;
        }

        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            setSponsorPaymentError('Invalid amount selected for checkout.');
            return;
        }

        const payload = {
            amount: Math.round(parsedAmount * 100) / 100,
            purchaseType,
            chargeMode,
            itemKey,
            itemTitle,
            planType: upgradeMeta?.planType || null,
            returnBaseUrl: getSafeReturnBaseUrl(),
            returnPath: getSafeReturnPath('/sponsorship')
        };

        setProcessingSponsorshipPayment(true);
        setSponsorPaymentError('');

        try {
            localStorage.setItem('sponsor_pending_payment', JSON.stringify({
                ...payload,
                upgradeMeta: upgradeMeta || null
            }));

            const data = await startPayPalCheckout({
                endpoint: '/sponsorships/paypal/create-order',
                token,
                body: payload,
                fallbackError: 'Unable to start sponsorship payment',
                backendBaseUrl: backendBase
            });

            window.location.href = data.approveUrl;
        } catch (e) {
            setSponsorPaymentError(e.message || 'Unable to start payment. Please try again.');
            setProcessingSponsorshipPayment(false);
        }
    };

    useEffect(() => {
        const handleLanguageChange = () => {
            setLanguage(localStorage.getItem('regaarder_language') || 'English');
        };
        window.addEventListener('storage', handleLanguageChange);
        return () => window.removeEventListener('storage', handleLanguageChange);
    }, []);

    useEffect(() => {
        const paypalClientId =
            (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PAYPAL_CLIENT_ID)
            || 'AUhb8uHt0gFlWH_vJdLf7M4soE91VyQuy5NHDPvLumnynuAFQj4mMuXdXHi9Vzy6nlRpaD0d2VGKpHtC';
        const existing = document.querySelector('script[data-paypal-sponsorship="1"]');
        if (existing || (typeof window !== 'undefined' && window.paypal)) {
            setPaypalSdkReady(true);
            return;
        }
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(paypalClientId)}&currency=USD&intent=capture`;
        script.async = true;
        script.setAttribute('data-paypal-sponsorship', '1');
        script.onload = () => setPaypalSdkReady(true);
        script.onerror = () => {
            setPaypalSdkReady(false);
            setSponsorPaymentError('Could not load PayPal. Please check your connection and try again.');
        };
        document.body.appendChild(script);
    }, []);

    useEffect(() => {
        const handleSponsorReturn = async () => {
            try {
                const params = new URLSearchParams(window.location.search || '');
                const sponsorPay = params.get('sponsorPay');
                const sponsorPaymentId = params.get('sponsorPaymentId');
                const orderId = params.get('token') || params.get('orderId');

                if (!sponsorPay || sponsorCaptureHandledRef.current) return;
                sponsorCaptureHandledRef.current = true;

                if (sponsorPay === 'cancel') {
                    setSponsorPaymentError('Payment cancelled.');
                }

                if (sponsorPay === '1' && sponsorPaymentId && orderId) {
                    const token = localStorage.getItem('regaarder_token');
                    if (!token) {
                        throw new Error('Please sign in to finalize your payment.');
                    }

                    setProcessingSponsorshipPayment(true);
                    const captureRes = await fetch(`${backendBase}/sponsorships/paypal/capture-order`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({ sponsorPaymentId, orderId })
                    });
                    const captureData = await captureRes.json().catch(() => ({}));
                    if (!captureRes.ok) {
                        throw new Error(captureData.error || 'Sponsorship payment capture failed');
                    }

                    const rawPending = localStorage.getItem('sponsor_pending_payment');
                    if (rawPending) {
                        try {
                            const pending = JSON.parse(rawPending);
                            if (pending?.purchaseType === 'subscription' && pending?.upgradeMeta?.endpoint && pending?.upgradeMeta?.planParam) {
                                await fetch(`${backendBase}${pending.upgradeMeta.endpoint}`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ plan: pending.upgradeMeta.planParam })
                                });
                            }
                        } catch (e) { }
                    }

                    localStorage.removeItem('sponsor_pending_payment');
                    try { window.alert('Payment completed successfully.'); } catch (e) { }
                }
            } catch (e) {
                setSponsorPaymentError(e.message || 'Unable to finalize payment.');
            } finally {
                setProcessingSponsorshipPayment(false);

                const cleanParams = new URLSearchParams(window.location.search || '');
                ['sponsorPay', 'sponsorPaymentId', 'token', 'orderId', 'PayerID'].forEach((k) => cleanParams.delete(k));
                const next = `${window.location.pathname}${cleanParams.toString() ? `?${cleanParams.toString()}` : ''}${window.location.hash || ''}`;
                window.history.replaceState({}, '', next);
            }
        };

        handleSponsorReturn();
    }, [backendBase]);

    const toggleAlaCarteSelection = (title) => {
        setSelectedAlaCarte(prev => {
            if (prev.includes(title)) return prev.filter(t => t !== title);
            return [...prev, title];
        });
    };

    const handleSelectPlan = (plan) => {
        const parsedAmount = Number(plan?.priceMonthly || 0);

        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            setSponsorPaymentError('This plan does not require payment.');
            return;
        }

        const upgradeMeta = getPlanUpgradeMeta(plan);
        startSponsorshipCheckout({
            amount: parsedAmount,
            purchaseType: 'subscription',
            chargeMode: 'monthly',
            itemKey: plan.title,
            itemTitle: plan.title,
            upgradeMeta
        });
    };

    useEffect(() => {
        // rebuild refs array and (re)observe whenever the set of visible cards may change
        cardRefs.current = cardRefs.current.slice(0);
        if (!('IntersectionObserver' in window)) return;
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const i = Number(entry.target.getAttribute('data-idx'));
                if (entry.isIntersecting) {
                    setVisibleIdx(prev => ({ ...prev, [i]: true }));
                }
            });
        }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

        cardRefs.current.forEach(el => { if (el) obs.observe(el); });
        return () => obs.disconnect();
    }, [showAlaCarte, billingPeriod]);

    // Close modal on Escape
    useEffect(() => {
        if (!showAddModal) return;
        const onKey = (e) => { if (e.key === 'Escape') setShowAddModal(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [showAddModal]);

    const ANNUAL_DISCOUNT = 0.17;

    const getPlanDetails = () => [
        {
            type: 'user',
            title: t('Starter (Free)'),
            priceMonthly: 0,
            features: [
                // Section 1: Core Access (bold, no icons)
                { text: t('1 active free request at a time'), section: 'Core Access', bold: true },
                { text: t('Up to 3 paid requests active'), section: 'Core Access', bold: true },
                
                // Section 2: Capabilities (with icons)
                { text: t('Target specific creators'), icon: Users, allowed: false },
                { text: t('Boosting available'), icon: Zap, allowed: false },
                { text: t('Contributor pooling'), icon: Users, allowed: true },
                
                // Section 3: Visibility (softer icon)
                { text: t('Visibility rotates over time'), icon: Eye, subtle: true },
                
                // Section 4: Quality (with icon)
                { text: t('Video quality up to 360p'), icon: MonitorPlay },
                
                // Section 5: Limits (small grey text, no icon)
                { text: t('Paid request total capped at $150'), section: 'Limits', small: true },
                { text: t('Higher resolutions available with upgrades'), section: 'Limits', small: true },
            ],
            cta: t('Start Free'),
            themeColor: ACCENT_COLOR,
        },
        {
            type: 'user',
            title: t('Pro'),
            priceMonthly: 8.24,
            oldPriceMonthly: 14.99,
            savingLabel: `Save $${(14.99 - 8.24).toFixed(2)}`,
            features: [
                // Section 1: Core Access (bold, no icons)
                { text: t('Unlimited free requests (with decay)'), section: 'Core Access', bold: true },
                { text: t('Up to 5 active paid requests'), section: 'Core Access', bold: true },
                
                // Section 2: Capabilities (with icons)
                { text: t('Target specific creators'), icon: Users, allowed: true },
                { text: t('Boosting available'), icon: Zap, allowed: true },
                { text: t('Contributor pooling enabled'), icon: Users, allowed: true },
                
                // Section 3: Visibility & Timing (with icons)
                { text: t('Priority visibility (slower decay)'), icon: Eye, allowed: true },
                { text: t('Repost faster after no response'), icon: RotateCw, allowed: true },
                { text: t('Priority creator matching'), icon: Sparkles, allowed: true },
                
                // Section 4: Experience (with icons)
                { text: t('No ads'), icon: Ban, allowed: true },
                { text: t('Faster request response'), icon: Zap, allowed: true },
                { text: t('Video quality up to 1080p'), icon: MonitorPlay, allowed: true },
                
                // Section 5: Value (bold highlight)
                { text: t('No hard cap on request value'), section: 'Value', bold: true },
            ],
            cta: t('Get Pro at 45% Off'),
            themeColor: ACCENT_COLOR,
            badge: { label: t('FLASH DEAL -45% OFF'), color: ACCENT_COLOR }
        },
        {
            type: 'creator',
            title: t('Starter Creator'),
            priceMonthly: 0,
            features: [
                // Section 1: Core Access (bold, no icons)
                { text: t('Max 3 paid requests per day'), section: 'Core Access', bold: true },
                { text: t('Unlimited free requests (optional)'), section: 'Core Access', bold: true },
                
                // Section 2: Capabilities (with icons)
                { text: t('Claim high-value requests (>$150)'), icon: Lock, allowed: false },
                { text: t('Creator dashboard & monetization'), icon: BarChart3, allowed: true },
                
                // Section 3: Visibility (with icons)
                { text: t('Standard visibility in feed'), icon: Eye },
                { text: t('Standard response window'), icon: Clock },
                
                // Section 4: Limits (small grey text, no icon)
                { text: t('Daily paid value capped at $150–$200'), section: 'Limits', small: true },
            ],
            cta: t('Start Creating'),
            themeColor: ACCENT_COLOR,
            badge: { label: t('Free'), color: ACCENT_COLOR }
        },
        {
            type: 'creator',
            title: t('Creator Pro'),
            priceMonthly: 14.99,
            subtitle: t('Priority Plan'),
            features: [
                // Section 1: Core Access (bold, no icons)
                { text: t('Up to 15 paid requests per day'), section: 'Core Access', bold: true },
                { text: t('No daily value cap'), section: 'Core Access', bold: true },
                
                // Section 2: Capabilities (with icons)
                { text: t('High-value requests unlocked'), icon: Unlock, allowed: true },
                { text: t('Claim & manage requests'), icon: RotateCw, allowed: true },
                { text: t('Queue management (accept/defer)'), icon: Target, allowed: true },
                
                // Section 3: Visibility & Reach (with icons)
                { text: t('Targeted requests with priority access'), icon: Target, allowed: true },
                { text: t('Boosted requests with priority'), icon: Zap, allowed: true },
                { text: t('Higher algorithmic trust weight'), icon: TrendingDown, allowed: true },
                
                // Section 4: Tools & Access (with icons)
                { text: t('Upload videos directly from your device'), icon: Share2, allowed: true },
                { text: t('Add merch links & other links in video'), icon: Share2, allowed: true },
                { text: t('Direct access to sponsors'), icon: Users, allowed: true },
                { text: t('Priority support'), icon: Headphones, allowed: true },
                
                // Section 5: Revenue (bold highlight)
                { text: t('Up to 80% revenue share'), section: 'Revenue', bold: true },
            ],
            cta: t('Unlock Priority Access'),
            themeColor: ACCENT_COLOR,
            badge: { label: t('BEST VALUE'), color: ACCENT_COLOR }
        }
    ];

    // Additional sections to show after plan cards
    const sections = [
        {
            type: 'brand',
            title: t('Brand'),
            oldPriceMonthly: 99.99,
            priceMonthly: 89.99,
            savingLabel: t('Save $10.00 today'),
            features: [
                'Everything in Creator, plus:',
                'UNLIMITED everything',
                'Multi-user team accounts (10 seats)',
                'Advanced brand analytics',
                'Sponsored creator network access',
                'Campaign performance tracking',
                'ROI & conversion analytics',
                'Custom integrations',
                'Bulk video requests',
                'Dedicated brand manager',
                'Custom contracts & agreements',
                'Priority creator partnerships',
                'Exclusive brand features',
                'White-label platform options',
                '500GB team storage',
                'SLA guarantee (1hr response)',
                'Quarterly business reviews',
                'Custom feature development'
            ],
            cta: 'Get Special Offer',
            themeColor: ACCENT_COLOR
        },
        {
            type: 'featuresRow'
        },
        {
            type: 'testimonial'
        }
    ];

    const plans = getPlanDetails();

    return (
        <div className="min-h-screen bg-white text-gray-900">
            <div className="max-w-md mx-auto px-4" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))', paddingBottom: 'calc(60px + env(safe-area-inset-bottom))' }} ref={containerRef}>
                {/* header */}
                <div className="flex items-center space-x-4 mb-2">
                    <ChevronLeft
                        className="w-6 h-6 text-gray-700 cursor-pointer transition hover:text-gray-900"
                        onClick={() => navigate('/home')}
                    />
                </div>
                <div className="text-center mb-6 pt-2">
                    <div className="inline-flex items-center justify-center p-3 rounded-full mb-3" style={{ backgroundColor: HIGHLIGHT_COLOR }}>
                        <Crown className="w-6 h-6" style={{ color: ACCENT_COLOR }} />
                    </div>
                    <h1 className="text-2xl font-bold mb-1">{t('Upgrade Your Premium Experience')}</h1>
                    <p className="text-gray-500 text-sm">{t('Choose the perfect plan for your needs')}</p>
                    {!!sponsorPaymentError && (
                        <p className="text-sm text-red-600 mt-3 font-medium">{sponsorPaymentError}</p>
                    )}
                </div>

                {/* Billing toggle (Daily / Monthly / Annual) */}
                <div className="flex justify-center mb-6">
                    <div 
                        className="inline-flex items-center gap-1 p-1 rounded-full"
                        style={{ backgroundColor: '#F3F4F6' }}
                        onClick={() => { setBillingPeriod(prev => prev === 'daily' ? 'monthly' : prev === 'monthly' ? 'annual' : 'daily'); setVisibleIdx({}); }}
                    >
                        <button 
                            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                                billingPeriod === 'daily' 
                                    ? 'text-white' 
                                    : 'text-gray-600'
                            }`}
                            style={billingPeriod === 'daily' ? { backgroundColor: '#374151' } : {}}
                        >
                            {t('Daily')}
                        </button>
                        <button 
                            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                                billingPeriod === 'monthly' 
                                    ? 'text-white' 
                                    : 'text-gray-600'
                            }`}
                            style={billingPeriod === 'monthly' ? { backgroundColor: '#374151' } : {}}
                        >
                            {t('Monthly')}
                        </button>
                        <button 
                            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                                billingPeriod === 'annual' 
                                    ? 'text-white' 
                                    : 'text-gray-600'
                            }`}
                            style={billingPeriod === 'annual' ? { backgroundColor: '#374151' } : {}}
                        >
                            {t('Yearly')}
                        </button>
                    </div>
                </div>

                {/* Toggle between Full Plans and À La Carte */}
                <div className="flex justify-center mb-10">
                    <div className="inline-flex gap-1 p-1 rounded-full" style={{ backgroundColor: HIGHLIGHT_COLOR }}>
                        <button 
                            onClick={() => { setShowAlaCarte(false); setVisibleIdx({}); }} 
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                                !showAlaCarte 
                                    ? 'text-white shadow-md' 
                                    : 'text-gray-600'
                            }`}
                            style={!showAlaCarte ? { backgroundColor: ACCENT_COLOR } : {}}
                        >
                            Full Plans
                        </button>
                        <button 
                            onClick={() => { setShowAlaCarte(true); setVisibleIdx({}); }} 
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                                showAlaCarte 
                                    ? 'text-white shadow-md' 
                                    : 'text-gray-600'
                            }`}
                            style={showAlaCarte ? { backgroundColor: ACCENT_COLOR } : {}}
                        >
                            À La Carte
                        </button>
                    </div>
                </div>

                {/* Plan cards — revealed on-scroll */}
                <div className="space-y-6">
                    {!showAlaCarte ? (
                        <>
                            <div className="text-center mb-8">
                                <div className="h-1 w-16 mx-auto mb-4" style={{ backgroundColor: ACCENT_COLOR }} />
                                <h2 className="text-2xl font-bold text-gray-900" style={{ color: ACCENT_COLOR }}>Our Plans</h2>
                                <p className="text-gray-500 text-sm mt-2">Choose a plan that fits your needs</p>
                            </div>
                            {plans.filter(p => !planType || p.type === planType).map((p, idx) => (
                                <div
                                    key={p.title}
                                    ref={el => cardRefs.current[idx] = el}
                                    data-idx={idx}
                                    className={`transform transition duration-700 ease-out ${visibleIdx[idx] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                                >
                                    <PlanCard {...p} badge={p.badge} billingPeriod={billingPeriod} annualDiscount={ANNUAL_DISCOUNT} onCtaClick={() => handleSelectPlan(p)} />
                                </div>
                            ))}
                        </>
                    ) : (
                        <>
                            <div className="text-center mt-2 mb-8">
                                <div className="h-1 w-16 mx-auto mb-4" style={{ backgroundColor: ACCENT_COLOR }} />
                                <h2 className="text-xl font-bold text-gray-900" style={{ color: ACCENT_COLOR }}>{t('Build Your Own Plan')}</h2>
                                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{t('Pick only the features you need without committing to a full plan')}</p>
                            </div>
                            {alaCarteItems.map((a, aIdx) => {
                                const idx = aIdx; // separate index space for ala carte
                                const displayPrice = formatPrice(a.priceMonthly, billingPeriod, ANNUAL_DISCOUNT);
                                const periodLabel = billingPeriod === 'daily' ? '/day' : (billingPeriod === 'monthly' ? '/month' : '/year');
                                
                                return (
                                    <div key={a.title} ref={el => cardRefs.current[idx] = el} data-idx={idx} className={`transform transition duration-700 ease-out ${visibleIdx[idx] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                                        <div className="rounded-2xl border p-5 bg-white transition-all duration-200" style={{ borderColor: '#E5E7EB' }}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-sm leading-snug text-gray-900 mb-1">{a.title}</h3>
                                                    <p className="text-xs text-gray-500 leading-relaxed">{a.description}</p>
                                                </div>
                                                <div className="text-right flex flex-col items-end flex-shrink-0">
                                                    <div className="text-lg font-bold" style={{ color: ACCENT_COLOR }}>{displayPrice}</div>
                                                    <div className="text-xs text-gray-500">{periodLabel}</div>
                                                    <button
                                                        type="button"
                                                        onClick={() => startSponsorshipCheckout({
                                                            amount: a.priceMonthly,
                                                            purchaseType: 'ala_carte',
                                                            chargeMode: 'one-time',
                                                            itemKey: a.title,
                                                            itemTitle: a.title
                                                        })}
                                                        disabled={processingSponsorshipPayment}
                                                        className="mt-3 text-xs font-semibold px-2.5 py-1 rounded text-white disabled:opacity-70"
                                                        style={{ backgroundColor: ACCENT_COLOR }}
                                                    >
                                                        {processingSponsorshipPayment ? 'Processing...' : 'Pay now'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {selectedAlaCarte.length > 0 && (
                            <div className="mt-6 p-6 rounded-3xl bg-white border-2 shadow-lg" style={{ borderColor: ACCENT_COLOR }}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-gray-600">{selectedAlaCarte.length} selected</div>
                                        <div className="text-2xl font-bold" style={{ color: ACCENT_COLOR }}>Total: {formatPrice(selectedAlaCarte.reduce((sum, t) => {
                                            const item = alaCarteItems.find(it => it.title === t);
                                            return sum + (item ? item.priceMonthly : 0);
                                        }, 0), billingPeriod, ANNUAL_DISCOUNT)}</div>
                                    </div>
                                    <div>
                                        <button onClick={() => setShowAddModal(true)} className="text-white px-6 py-2 rounded-xl font-semibold transition-all hover:opacity-90 active:scale-95" style={{ backgroundColor: ACCENT_COLOR }}>Add selected</button>
                                    </div>
                                </div>
                            </div>
                            )}
                        </>
                    )}
                </div>

            </div>

            {/* Plan Type Selection Modal */}
            {showPlanTypeModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-50">
                    <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl p-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-2" style={{ color: ACCENT_COLOR }}>{t('Choose Your Plan Type')}</h2>
                            <p className="text-gray-600 text-sm mb-8">{t('Select whether you\'re looking for a user or creator plan')}</p>
                        </div>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={() => {
                                    setPlanType('user');
                                    setShowPlanTypeModal(false);
                                }}
                                className="w-full px-6 py-4 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                                style={{ backgroundColor: ACCENT_COLOR }}
                            >
                                {t('For Users')}
                            </button>
                            <button 
                                onClick={() => {
                                    setPlanType('creator');
                                    setShowPlanTypeModal(false);
                                }}
                                className="w-full px-6 py-4 rounded-xl font-semibold transition-all hover:opacity-90 active:scale-95"
                                style={{ borderColor: ACCENT_COLOR, color: ACCENT_COLOR, borderWidth: '2px' }}
                            >
                                {t('For Creators')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add-selected Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowAddModal(false)} />
                    <div role="dialog" aria-modal="true" className="relative w-full mx-4 bg-white rounded-2xl shadow-xl p-4" style={{ maxWidth: '28rem', maxHeight: '76vh', overflowY: 'auto' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">{t('Add selected')} À La Carte {t('items')}</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500">{t('Close')}</button>
                        </div>
                        <div className="space-y-3 max-h-64 overflow-auto">
                            {selectedAlaCarte.map((t) => {
                                const item = alaCarteItems.find(i => i.title === t);
                                if (!item) return null;
                                return (
                                    <div key={t} className="flex items-center justify-between p-2 border-b border-gray-100">
                                        <div>
                                            <div className="font-medium">{item.title}</div>
                                            <div className="text-xs text-gray-500">{item.description}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold">{formatPrice(item.priceMonthly, billingPeriod, ANNUAL_DISCOUNT)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-600">{t('Items')}: {selectedAlaCarte.length}</div>
                                <div className="text-lg font-semibold">{t('Total')}: {formatPrice(selectedAlaCarte.reduce((sum, t) => {
                                    const item = alaCarteItems.find(it => it.title === t);
                                    return sum + (item ? item.priceMonthly : 0);
                                }, 0), billingPeriod, ANNUAL_DISCOUNT)}</div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl border">{t('Cancel')}</button>
                                <button onClick={() => { setShowAddModal(false); setSelectedAlaCarte([]); }} className="px-4 py-2 rounded-xl bg-[var(--color-accent)] text-white">{t('Confirm Add')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Bottom footer */}
            <SharedBottomBar selectedLanguage={localStorage.getItem('regaarder_language') || 'English'} />
        </div>
    );
};

export default Sponsorships;
