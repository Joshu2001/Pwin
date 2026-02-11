import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from './AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { getTranslation } from './translations.js';
import SharedBottomBar from './components/SharedBottomBar.jsx';

// Lightweight event-bus inlined here to avoid module resolution issues.
// Exposed on `window.__eventBus` so other modules can use it if present.
const __listeners = {};
const _on = (event, cb) => {
    if (!__listeners[event]) __listeners[event] = [];
    __listeners[event].push(cb);
    return () => _off(event, cb);
};

// Share your vision / Creative brief page
const ShareVision = ({ setCurrentPage, ACCENT_COLOR }) => {
    const t = (key) => getTranslation(key, (typeof window !== 'undefined' ? localStorage.getItem('regaarder_language') : 'English') || 'English');
    const [brief, setBrief] = useState('');
    const [logoData, setLogoData] = useState('');
    const [brandGuideData, setBrandGuideData] = useState('');
    const [previewBeforePublish, setPreviewBeforePublish] = useState(true);
    const logoRef = useRef(null);
    const guideRef = useRef(null);
    const MAX_CHARS = 500;

    useEffect(() => {
        try { const b = localStorage.getItem('sponsor_creative_brief'); if (b) setBrief(b); } catch (e) {}
        try { const l = localStorage.getItem('sponsor_asset_logo'); if (l) setLogoData(l); } catch (e) {}
        try { const g = localStorage.getItem('sponsor_asset_brandguide'); if (g) setBrandGuideData(g); } catch (e) {}
        try { const p = localStorage.getItem('sponsor_preview_before_publish'); if (p != null) setPreviewBeforePublish(p === '1'); } catch (e) {}
    }, []);

    const handleFile = (file, setter, storageKey) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try { const data = reader.result; setter(data); localStorage.setItem(storageKey, data); } catch (e) {}
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-3">
                <button onClick={() => setCurrentPage('AudienceSelection')} className="text-gray-600 hover:text-gray-900 p-2 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-sm text-gray-500">{t('Step 6 of 6')}</div>
                <div className="text-sm text-gray-500">{t('100% complete')}</div>
            </div>

            {/* Progress bar for Step 6 (content-integration path) */}
            <div className="w-full mb-4">
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full" style={{ width: '100%', background: ACCENT_COLOR }} />
                </div>
            </div>

            <div className="text-center mb-6">
                <h1 className="text-2xl font-medium text-gray-900">{t('Share your vision')}</h1>
                <p className="text-sm text-gray-500 mt-2">{t('Give creators the context they need to bring your brand to life')}</p>
            </div>

            <div className="mb-4">
                <label className="text-sm font-medium text-gray-900">{t('Creative Brief')} *</label>
                <textarea
                    value={brief}
                    onChange={(e) => setBrief(e.target.value.slice(0, MAX_CHARS))}
                    placeholder={t("Tell creators about your brand, product, and what kind of story you'd love to see. Be inspiring, not restrictive!")}
                    className="w-full mt-3 p-4 rounded-xl border border-gray-200 bg-gray-50 h-40 text-gray-700"
                />
                <div className="text-xs text-gray-400 mt-2">{brief.length}/{MAX_CHARS} characters</div>
            </div>

            <div className="mb-6">
                <div className="text-sm font-medium text-gray-900 mb-3">{t('Creative Assets (Optional)')}</div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files && e.target.files[0], setLogoData, 'sponsor_asset_logo')} />
                        <button onClick={() => logoRef.current && logoRef.current.click()} className="w-full p-6 rounded-2xl bg-white border border-gray-100 text-center">
                            <Upload className="w-6 h-6 mx-auto text-gray-400" />
                            <div className="text-sm text-gray-600 mt-3">{t('Logo / Images')}</div>
                            {logoData && <div className="text-xs text-gray-400 mt-2 truncate">{t('Attached')}</div>}
                        </button>
                    </div>

                    <div>
                        <input ref={guideRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => handleFile(e.target.files && e.target.files[0], setBrandGuideData, 'sponsor_asset_brandguide')} />
                        <button onClick={() => guideRef.current && guideRef.current.click()} className="w-full p-6 rounded-2xl bg-white border border-gray-100 text-center">
                            <FileText className="w-6 h-6 mx-auto text-gray-400" />
                            <div className="text-sm text-gray-600 mt-3">{t('Brand Guide')}</div>
                            {brandGuideData && <div className="text-xs text-gray-400 mt-2 truncate">{t('Attached')}</div>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <label className="flex items-start space-x-3 cursor-pointer">
                    <input type="checkbox" checked={previewBeforePublish} onChange={(e) => setPreviewBeforePublish(e.target.checked)} className="mt-1" />
                    <div>
                        <div className="font-medium text-gray-900">{t('Preview content before it goes live')}</div>
                        <div className="text-sm text-gray-500">{t("You'll get a chance to review and request changes (limited to 1-2 rounds)")}</div>
                    </div>
                </label>
            </div>

            <div className="pt-6">
                <button
                    className="w-full flex items-center justify-center space-x-2 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition duration-300 hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: ACCENT_COLOR }}
                    onClick={() => {
                                        try { localStorage.setItem('sponsor_creative_brief', brief); } catch (e) {}
                                        try { localStorage.setItem('sponsor_preview_before_publish', previewBeforePublish ? '1' : '0'); } catch (e) {}
                                        try {
                                            const startChoice = localStorage.getItem('start_coll_choice');
                                            if (startChoice === 'content_integration') {
                                                setCurrentPage('MeetCreators');
                                                return;
                                            }
                                        } catch (e) {}
                                        setCurrentPage('SponsorSummary');
                    }}
                    disabled={brief.trim().length === 0}
                >
                    <span>{t('Continue')}</span>
                    <ChevronRight className="w-4 h-4 ml-2" />
                </button>
            </div>
        </div>
    );
};
const _off = (event, cb) => {
    if (!__listeners[event]) return;
    __listeners[event] = __listeners[event].filter(fn => fn !== cb);
    if (__listeners[event].length === 0) delete __listeners[event];
};
const _emit = (event, payload) => {
    const fns = __listeners[event] || [];
    for (let i = 0; i < fns.length; i++) {
        try { fns[i](payload); } catch (e) { console.error('event-bus handler error', e); }
    }
};
try {
    if (typeof window !== 'undefined') {
        // avoid overwriting if host app already provided a bus
        if (!window.__eventBus) window.__eventBus = { on: _on, off: _off, emit: _emit };
    }
} catch (e) {}

// Local aliases used throughout this file
const busOn = (e, cb) => (typeof window !== 'undefined' && window.__eventBus && window.__eventBus.on) ? window.__eventBus.on(e, cb) : _on(e, cb);
const busOff = (e, cb) => (typeof window !== 'undefined' && window.__eventBus && window.__eventBus.off) ? window.__eventBus.off(e, cb) : _off(e, cb);
const busEmit = (e, p) => { if (typeof window !== 'undefined' && window.__eventBus && window.__eventBus.emit) { try { window.__eventBus.emit(e, p); } catch (err) {} } else { _emit(e, p); } };
// Imports for lucide icons
import { Home, FileText, Lightbulb, MoreHorizontal, Sparkles, Rocket, LineChart, Eye, Zap, Shield, HeartHandshake, ChevronRight, ChevronLeft, FileEdit, DollarSign, Pencil, Heart, Gift, Users, ArrowLeft, Briefcase, Layers, Crown, Upload, ChevronDown, ChevronUp, Check, MousePointerClick, Building2 } from 'lucide-react';
import { translations } from './translations.js';

// Helper for in-file translations; reads selected language from localStorage at runtime.
const t = (key) => {
    try {
        const lang = (typeof window !== 'undefined' && window.localStorage) ? (window.localStorage.getItem('regaarder_language') || 'English') : 'English';
        return getTranslation(key, lang || 'English');
    } catch (e) { return key; }
};

// Use CSS custom properties so the theme provider can control colors at runtime
const getCssVar = (name, fallback) => {
    try { const v = getComputedStyle(document.documentElement).getPropertyValue(name); return v ? v.trim() : fallback; } catch (e) { return fallback; }
};
// Prefer CSS variables so changes by `ThemeProvider` are reflected automatically
const ACCENT_COLOR = 'var(--color-gold)';
const HIGHLIGHT_COLOR = 'var(--color-gold-light)'; // A lighter, custom shade for the background highlight
const ICON_BACKGROUND = 'var(--color-gold-cream)';
const PROGRESS_BLUE = '#2563eb';

// Platform fee configuration
// Default expressed as a fraction (e.g. 0.02 === 2%)
const DEFAULT_PLATFORM_FEE_PCT = 0.02;
// Reads `platform_fee_pct` from localStorage if set. Accepts either a fraction
// (0.02) or a percent value (2 => 2%). Falls back to DEFAULT_PLATFORM_FEE_PCT.
const getPlatformFeePct = () => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_PLATFORM_FEE_PCT;
        const raw = window.localStorage.getItem('platform_fee_pct');
        if (raw == null) return DEFAULT_PLATFORM_FEE_PCT;
        const n = parseFloat(raw);
        if (Number.isNaN(n)) return DEFAULT_PLATFORM_FEE_PCT;
        // If user stored a whole-number percent (e.g. "2"), convert to fraction
        if (n > 1) return n / 100;
        return n;
    } catch (e) {
        return DEFAULT_PLATFORM_FEE_PCT;
    }
};

// Progress helper: compute percentage from step and total (returns integer percent)
const computeProgressPct = (step, total) => {
    try {
        const s = Number(step) || 0;
        const t = Number(total) || 1;
        return Math.round((s / t) * 100);
    } catch (e) { return 0; }
};

// Default total steps used by onboarding flows (adjustable)
const DEFAULT_TOTAL_STEPS = 6;

// Helper: compact number formatter (1,000 -> 1K, 10,000 -> 10K, 1,200,000 -> 1.2M)
const formatCompact = (n) => {
    const num = Number(n) || 0;
    const abs = Math.abs(num);
    if (abs >= 1_000_000) {
        const v = Math.round((num / 1_000_000) * 10) / 10;
        return `${v % 1 === 0 ? String(Math.round(v)) : v}M`;
    }
    if (abs >= 1000) {
        const v = Math.round((num / 1000) * 10) / 10;
        return `${v % 1 === 0 ? String(Math.round(v)) : v}K`;
    }
    return String(num);
};

// --- Payment integration stubs (client-side simulation) ---
// These are placeholders to simulate external provider interactions.
const stubStripeTokenize = async (cardData = {}) => {
    // Simulate tokenization delay
    await new Promise(r => setTimeout(r, 600));
    return { token: `tok_${Math.random().toString(36).slice(2,10)}` };
};

const createWiseLink = (amount = 0) => {
    return `https://wise.com/transfer?amount=${encodeURIComponent(amount)}&source=demo&ref=adflow`;
};

const createPayoneerLink = (amount = 0) => {
    return `https://payoneer.com/pay?amount=${encodeURIComponent(amount)}&ref=adflow`;
};

const getBankTransferDetails = (amount = 0) => ({
    accountName: 'Regaarder Ltd',
    accountNumber: '1234567890',
    routing: '021000021',
    bankName: 'Demo Bank',
    reference: `Sponsor-${Date.now()}`,
    amount: Number(amount || 0)
});

const getWesternUnionInstructions = (amount = 0) => ({
    receiver: 'Regaarder Ltd',
    city: 'London',
    country: 'UK',
    amount: Number(amount || 0),
    note: `Reference: Sponsor-${Date.now()}`
});

// Account balance helpers
const getAccountBalance = () => {
    try { return Number(window.localStorage.getItem('account_balance') || 0); } catch (e) { return 0; }
};

const chargeFromAccount = (amount) => {
    try {
        const bal = getAccountBalance();
        const a = Number(amount) || 0;
        if (a <= 0) return false;
        if (bal < a) return false;
        const next = Math.max(0, bal - a);
        window.localStorage.setItem('account_balance', String(next));
        return true;
    } catch (e) { return false; }
};

// Add a completed campaign to localStorage and notify UI
// Accepts richer metadata so each campaign stores its own context.
const addCompletedCampaign = ({
    name,
    spent = 0,
    creators = 0,
    status = 'completed',
    model = null,
    budgetCap = null,
    escrowAmount = null,
    estimatedReach = null,
    creatorIds = null,
    metadata = {}
} = {}) => {
    try {
        const raw = window.localStorage.getItem('advertiser_campaigns');
        let list = [];
        if (raw) {
            try { list = JSON.parse(raw) || []; } catch (e) { list = []; }
        }
        const id = `c_${Date.now()}`;
        const title = name || `Campaign`;
        const item = {
            id,
            name: title,
            status,
            spent: Number(spent) || 0,
            creators: Number(creators) || 0,
            model: model || (localStorage.getItem('sponsor_selected_model') || null),
            budgetCap: budgetCap != null ? Number(budgetCap) : (Number(localStorage.getItem('sponsor_budget_cap') || 0) || null),
            escrowAmount: escrowAmount != null ? Number(escrowAmount) : (Number(localStorage.getItem('sponsor_escrow_amount') || 0) || null),
            estimatedReach: estimatedReach != null ? Number(estimatedReach) : (Number(localStorage.getItem('sponsor_estimated_reach') || 0) || null),
            creatorIds: Array.isArray(creatorIds) ? creatorIds : (function(){ try { const r = localStorage.getItem('matched_selected_creator_ids') || localStorage.getItem('sponsor_selected_ids'); if (r) { const a = JSON.parse(r); if (Array.isArray(a)) return a; } return []; } catch(e){ return []; } })(),
            createdAt: Date.now(),
            metadata: metadata || {}
        };
        list.unshift(item);
        window.localStorage.setItem('advertiser_campaigns', JSON.stringify(list));
        // Also reflect sponsor_selected_count if needed
        try { window.localStorage.setItem('sponsor_selected_count', String(Number(creators) || 0)); } catch (e) {}
        // Notify other parts of the app
        try { busEmit('advertiser:campaigns_updated', list); } catch (e) {}
        return item;
    } catch (e) { return null; }
};

const isProfileCreated = () => {
    try { return !!window.localStorage.getItem('advertiser_profile_created'); } catch (e) { return false; }
};

const navigateToStartCollabOrHome = (setCurrentPage) => {
    if (isProfileCreated()) setCurrentPage('Home'); else setCurrentPage('StartCollaboration');
};

// Note: cropping dependency removed. We use a simple upload+preview flow.

// --- Utility Components and Functions (Used by both pages) ---

// Custom component for the sticky header
const StickyHeader = ({ ACCENT_COLOR, setCurrentPage, visible }) => {
    // All scroll logic remains removed to maintain stability.
    if (!visible) return null;

    const headerClass = `
        fixed top-0 left-0 right-0 z-20 
        bg-white/95 backdrop-blur-sm 
        border-b border-gray-200 shadow-sm
        transition-transform duration-300
        transform translate-y-0
        sticky-animate
    `;

    return (
        <div className={headerClass} style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
            {/* Header Content Container, centered and max-w matched to main content */}
            <div className="max-w-md mx-auto flex justify-between items-center px-4 py-3">
                <p className="text-sm font-medium text-gray-800">{t('Ready to start collaborating?')}</p>
                <button
                    className="flex items-center space-x-2 text-white font-semibold py-2 px-4 rounded-full transition duration-300 shadow hover:opacity-90 text-xs"
                    style={{ backgroundColor: ACCENT_COLOR }}
                    onClick={() => setCurrentPage('Welcome')} // CTA 1: Sticky Header
                >
                    <Rocket className="w-4 h-4" />
                    <span>{t('Get Started')}</span>
                </button>
            </div>
        </div>
    );
};

// --- HOMEPAGE COMPONENTS ---

const StatBlock = ({ icon: Icon, value, label }) => (
    <div className="flex flex-col items-center p-3">
        <div className="mb-4 opacity-40" style={{ color: ACCENT_COLOR }}>
                <Icon className="w-8 h-8" />
        </div>
        <div className="text-xl font-semibold text-gray-900">{value}</div>
        <div className="text-[11px] text-gray-500 mt-1 uppercase tracking-wider">{t(label)}</div>
    </div>
);

const FeatureBlock = ({ icon: Icon, title, description }) => (
    <div className="flex flex-col py-4 items-start">
        <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
            style={{ backgroundColor: ICON_BACKGROUND }}
        >
            <Icon className="w-5 h-5" style={{ color: ACCENT_COLOR }} />
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-1">{t(title)}</h2>
        <p className="text-sm text-gray-600">{t(description)}</p>
    </div>
);

const StepBlock = ({ step, icon: Icon, title, description }) => (
    <div className="flex space-x-4 items-start py-4">
        <div className="flex-shrink-0 flex flex-col items-center">
            <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: ICON_BACKGROUND }}
            >
                <Icon className="w-6 h-6" style={{ color: ACCENT_COLOR }} />
            </div>
            {step < 4 && (
                <div className="w-px h-12" style={{ backgroundColor: ACCENT_COLOR, opacity: 0.28 }}></div>
            )}
        </div>
        <div className="flex-grow pt-0.5">
            <p className="text-[12px] font-semibold mb-1" style={{ color: ACCENT_COLOR }}>
                STEP 0{step}
            </p>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{t(title)}</h3>
            <p className="text-sm text-gray-600">{t(description)}</p>
        </div>
    </div>
);

const PricingMetricBlock = ({ icon: Icon, title, value, subtext }) => (
    <div className="flex flex-col items-center text-center px-4">
        <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: ICON_BACKGROUND }}
        >
            <Icon className="w-6 h-6" style={{ color: ACCENT_COLOR }} />
        </div>
        <div className="text-2xl font-semibold mb-1" style={{ color: ACCENT_COLOR }}>
            {value}
        </div>
        <p className="text-base font-medium text-gray-900 mb-1 whitespace-nowrap">{t(title)}</p>
        <p className="text-sm text-gray-600">{t(subtext)}</p>
    </div>
);

const BudgetExampleBlock = ({ icon: Icon, budget }) => (
    <div className="p-4 rounded-2xl w-full text-left mt-6" style={{ backgroundColor: ICON_BACKGROUND }}>
        <div className="flex items-center mb-4">
            <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"
                style={{ backgroundColor: ACCENT_COLOR }}
            >
                <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-base font-semibold text-gray-900">
                {t('Example')}: ${budget} {t('budget')}
            </p>
        </div>
        <dl className="space-y-2 w-full pl-12">
            <div className="text-sm text-gray-700">
                <dt className="font-semibold text-gray-900">{t('Projected Reach')}</dt>
                <dd className="font-medium">{t('40K-80K views')}</dd>
            </div>
            <div className="text-sm text-gray-700">
                <dt className="font-semibold text-gray-900">{t('Est. Engagement')}</dt>
                <dd className="font-medium">{t('2.9K-5.8K')}</dd>
            </div>
            <div className="text-sm text-gray-700">
                <dt className="font-semibold text-gray-900">{t('Avg. Creators')}</dt>
                <dd className="font-medium">{t('2-4 creators')}</dd>
            </div>
        </dl>
    </div>
);

const FinalCTA = ({ ACCENT_COLOR, HIGHLIGHT_COLOR, setCurrentPage }) => (
    <section className="pt-10 pb-20 flex flex-col items-center text-center">
        <div 
            className="w-16 h-16 rounded-xl flex items-center justify-center mb-6"
            style={{ backgroundColor: ICON_BACKGROUND }}
        >
            <Rocket className="w-8 h-8" style={{ color: ACCENT_COLOR }} />
        </div>
        <h2 className="text-3xl font-medium text-gray-900 leading-snug mb-4 max-w-xs">
            {t('Ready to turn viewers into believers?')}
        </h2>
        <p className="text-base text-gray-600 mt-2 mb-8 font-medium max-w-xs">
            {t('Join thousands of brands collaborating with creators on Regaarder. Start your first campaign in minutes.')}
        </p>
            <button
                className="w-full flex items-center justify-center space-x-2 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition duration-300 hover:opacity-90 max-w-sm text-sm"
                style={{ backgroundColor: ACCENT_COLOR, boxShadow: '0 10px 15px -3px rgba(var(--color-gold-rgb),0.44), 0 4px 6px -4px rgba(var(--color-gold-rgb),0.44)' }}
                onClick={() => setCurrentPage('Welcome')} // CTA 4: Final CTA
            >
            <Sparkles className="w-4 h-4" fill="currentColor" />
            <span>{t('Launch Your First Collaboration')}</span>
            <ChevronRight className="w-4 h-4 ml-1" />
        </button>
        <div className="text-xs text-gray-500 mt-5 font-medium flex justify-center space-x-4">
            <span className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                <span>{t('Free setup')}</span>
            </span>
            <span className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                <span>{t('No credit card required')}</span>
            </span>
            <span className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                <span>{t('Cancel anytime')}</span>
            </span>
        </div>
    </section>
);

// Shared fixed Continue CTA placed above the BottomBar
const ContinueCTA = ({ disabled, onClick, ACCENT_COLOR, bottomOffset = 'auto' }) => {
    return (
        <div className="w-full mt-8 mb-4">
            <button
                onClick={onClick}
                disabled={disabled}
                className={`w-full flex items-center justify-center space-x-2 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition duration-300 hover:opacity-90 disabled:opacity-50 active:scale-[0.98]`}
                style={{ backgroundColor: ACCENT_COLOR }}
            >
                <span>{t('Continue')}</span>
                <ChevronRight className="w-4 h-4 ml-2" />
            </button>
        </div>
    );
};

const HomePage = ({ ACCENT_COLOR, HIGHLIGHT_COLOR, ICON_BACKGROUND, setCurrentPage, setShowSticky }) => {
    const heroRef = useRef(null);

    useEffect(() => {
        if (!setShowSticky) return;
        const el = heroRef.current;
        if (!el) return;

        const onScroll = () => {
            const top = el.getBoundingClientRect().top;
            setShowSticky(top <= 0);
        };

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            // hide sticky when leaving this page
            try { setShowSticky(false); } catch (e) {}
        };
    }, [setShowSticky]);

    return (
        <>
            {/* --- 1. Hero Section --- */}
            <header className="flex flex-col items-center text-center mb-10">
            <p className="text-sm font-medium text-gray-600 mb-4 flex items-center">
                <Sparkles className="w-4 h-4 mr-2" fill="currentColor" style={{ color: ACCENT_COLOR }} />
                {t('Collaborate with original minds')}
            </p>
            <h1 className="text-3xl sm:text-4xl font-medium text-gray-900 leading-tight mt-6"> 
                {t("Collaborate with the world's most")}
                <span className="relative inline-block mx-1">
                <span className="absolute inset-0 rounded-lg transform -skew-y-1" style={{ backgroundColor: HIGHLIGHT_COLOR }}></span>
                <span className="relative" style={{ color: ACCENT_COLOR }}>{t('original minds')}</span>
                </span> 
                {t(', not just advertise')}
            </h1>
            <p ref={heroRef} className="text-base text-gray-600 mt-6 leading-relaxed max-w-xs font-medium">
                {t('Watch creators seamlessly integrate your brand into their stories. No banners. No interruptions. Just authentic storytelling.')}
            </p>
            </header>

            {/* --- 2. Video Placeholder --- */}
            <section className="mt-8 mb-12">
            <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center shadow-inner overflow-hidden">
                <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-105 animate-pulse-glow" 
                    style={{ backgroundColor: HIGHLIGHT_COLOR }}
                    onClick={() => console.log('Video clicked: Watch how it works')} // Kept as console.log
                >
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path 
                            d="M6 19L18 12L6 5V19Z" 
                            stroke={ACCENT_COLOR} 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                        />
                    </svg>
                </div>
            </div>
            <p className="text-sm text-gray-700 font-medium text-center mt-3 cursor-pointer transition hover:opacity-80" style={{ color: ACCENT_COLOR }}>
                {t('Watch how it works')} 
                <span className="ml-1 text-base leading-none">↗</span>
            </p>
            </section>

            {/* --- 3. Primary CTA Button --- */}
            <section className="mb-12">
            <button
                className="w-full flex items-center justify-center space-x-2 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition duration-300 hover:opacity-90 text-sm"
                style={{ backgroundColor: ACCENT_COLOR, boxShadow: '0 10px 15px -3px rgba(var(--color-gold-rgb),0.44), 0 4px 6px -4px rgba(var(--color-gold-rgb),0.44)' }}
                onClick={() => setCurrentPage('Welcome')} // CTA 2: Primary Hero Button
            >
                <Rocket className="w-4 h-4" fill="currentColor" />
                <span>{t('Launch Your First Collaboration')}</span>
            </button>
            </section>

            {/* --- 4. Statistics Section --- */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-200 pt-6 mb-12">
            <StatBlock icon={Users} value="50K+" label={t("Active Creators")} />
            <StatBlock icon={LineChart} value="7.3%" label={t("Avg Engagement")} /> 
            <StatBlock icon={Eye} value="2.5B" label={t("Total Reach")} />
            </section>
            
            {/* --- 5. How It Works Section --- */}
            <section className="pb-12 border-b border-gray-200">
                <h2 className="text-2xl font-medium text-gray-900 text-center">{t('How it works')}</h2>
                <p className="text-base text-gray-600 mt-2 mb-8 text-center font-medium">{t('From idea to impact in 4 simple steps')}</p>
                <StepBlock step={1} icon={FileEdit} title={t("Tell us about your brand")} description={t("Quick setup ??just your brand name, industry, and voice. Takes 2 minutes.")}/>
                <StepBlock step={2} icon={Lightbulb} title={t("Create your collaboration brief")} description={t("Set your objective, budget, and creative vision. Our AI does the rest.")}/>
                <StepBlock step={3} icon={Sparkles} title={t("Get matched with perfect creators")} description={t("AI analyzes thousands of creators to find your ideal matches instantly.")}/>
                <StepBlock step={4} icon={LineChart} title={t("Watch your brand come to life")} description={t("Creators integrate your brand authentically. Track real-time performance.")}/>
                
                <div className="flex justify-center mt-10">
                    <button
                        className="flex items-center space-x-2 text-white font-semibold py-3 px-6 rounded-full shadow-lg transition duration-300 hover:opacity-90"
                        style={{ backgroundColor: ACCENT_COLOR }}
                        onClick={() => setCurrentPage('Welcome')} // CTA 3: How it Works Button
                    >
                        <span>{t('Get Started Now')}</span>
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                </div>
            </section>

            {/* --- 6. Why brands love Regaarder Section (Content omitted for brevity, but structure remains) --- */}
            <section className="py-12 border-b border-gray-200">
                <h2 className="text-2xl font-medium text-gray-900 text-center">{t('Why brands love Regaarder')}</h2>
                <p className="text-base text-gray-600 mt-2 mb-8 text-center font-medium">{t('Your brand deserves great storytelling')}</p>
                <FeatureBlock icon={Zap} title={t("AI-Powered Matching")} description={t("Our AI finds creators who truly resonate with your brand values")}/>
                <FeatureBlock icon={HeartHandshake} title={t("Authentic Integration")} description={t("Creators bring your brand to life, their way")}/>
                <FeatureBlock icon={Shield} title={t("Escrow Protection")} description={t("Your budget is safe. Pay only when content goes live")}/>
                <FeatureBlock icon={LineChart} title={t("Real-Time Analytics")} description={t("Track every view, like, and comment as they happen")}/>
            </section>

            {/* --- 7. Pricing Section (Content omitted for brevity, but structure remains) --- */}
            <section className="py-12 border-b border-gray-200">
                <h2 className="text-2xl font-medium text-gray-900 text-center">{t('Transparent, performance-based pricing')}</h2>
                <p className="text-base text-gray-600 mt-2 mb-10 text-center font-medium">{t('Pay for results, not promises')}</p>
                
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: ICON_BACKGROUND }}>
                        <DollarSign className="w-8 h-8" style={{ color: ACCENT_COLOR }} />
                    </div>
                    <div className="text-2xl font-semibold mb-1" style={{ color: ACCENT_COLOR }}>$5</div>
                    <p className="text-base font-medium text-gray-900 mb-6">{t('Base CPM')}</p>
                    <p className="text-base text-gray-600 font-medium">{t('Per 1,000 views')}</p>
                </div>

                <div className="flex flex-col items-center space-y-8 mb-12">
                    <PricingMetricBlock icon={Shield} value="$100" title={t("Minimum Budget")} subtext={t("Goes into escrow")} />
                    <PricingMetricBlock icon={Heart} value="$0.05" title={t("Engagement Bonus")} subtext={t("Per like, comment, share")} />
                </div>
                <BudgetExampleBlock budget={500} icon={Gift} />
            </section>
            
            {/* --- 8. Final CTA Section --- */}
            <FinalCTA ACCENT_COLOR={ACCENT_COLOR} HIGHLIGHT_COLOR={HIGHLIGHT_COLOR} setCurrentPage={setCurrentPage} />
            
            {/* Placeholder to ensure scrollability above the footer */}
            <div className="h-20"></div> 
        </>
    );
}

// --- WELCOME/SIGN-UP FLOW COMPONENTS ---

const RoleOption = ({ icon: Icon, title, subtitle, ACCENT_COLOR, ICON_BACKGROUND, onClick }) => (
    <button 
        onClick={onClick} 
        className="flex items-start text-left p-4 pr-6 rounded-2xl w-full transition duration-150 border border-gray-100 hover:border-gray-300 active:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 mb-4"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
        <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 flex-shrink-0"
            style={{ backgroundColor: ICON_BACKGROUND }}
        >
            <Icon className="w-6 h-6" style={{ color: ACCENT_COLOR }} />
        </div>
        
        <div className="flex flex-col">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 font-medium mt-0.5">{subtitle}</p>
        </div>
        
    </button>
);

const WelcomeHeader = ({ title, subtitle, setCurrentPage, previousPage }) => (
    <header className="flex items-center space-x-4 mb-10">
        <button 
            onClick={() => setCurrentPage(previousPage)} 
            className="text-gray-500 hover:text-gray-900 transition p-2 -ml-2 rounded-full active:bg-gray-100"
        >
            <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
            <h1 className="text-xl font-medium text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
    </header>
);

const WelcomePage = ({ setCurrentPage, ACCENT_COLOR, ICON_BACKGROUND }) => {
    return (
        <div className="w-full">
            <WelcomeHeader 
                title={t("Welcome to Regaarder")} 
                subtitle={t("Tell us about your brand")} 
                setCurrentPage={setCurrentPage}
                previousPage={'Home'}
            />
            
            <section>
                <p className="text-lg font-semibold text-gray-900 mb-1">{t("I am a...")}</p>
                <p className="text-sm text-gray-600 mb-8">{t("This helps us personalize your experience")}</p>

                <div className="space-y-4">
                    <RoleOption 
                        icon={FileText} 
                        title={t("Brand / Company")} 
                        subtitle={t("Established business looking to expand reach")}
                        ACCENT_COLOR={ACCENT_COLOR}
                        ICON_BACKGROUND={ICON_BACKGROUND}
                        onClick={() => { try { localStorage.setItem('welcome_selected_role', 'brand'); } catch (e) {} setCurrentPage('BrandDetails'); }}
                    />
                    <RoleOption 
                        icon={Rocket} 
                        title={t("Startup / Creator-owned Brand")} 
                        subtitle={t("Growing brand seeking authentic partnerships")}
                        ACCENT_COLOR={ACCENT_COLOR}
                        ICON_BACKGROUND={ICON_BACKGROUND}
                        onClick={() => { try { localStorage.setItem('welcome_selected_role', 'startup'); } catch (e) {} setCurrentPage('BrandDetails'); }}
                    />
                    <RoleOption 
                        icon={Briefcase} 
                        title={t("Agency / Media Buyer")} 
                        subtitle={t("Managing campaigns for multiple clients")}
                        ACCENT_COLOR={ACCENT_COLOR}
                        ICON_BACKGROUND={ICON_BACKGROUND}
                        onClick={() => { try { localStorage.setItem('welcome_selected_role', 'agency'); } catch (e) {} setCurrentPage('BrandDetails'); }}
                    />
                </div>
            </section>
        </div>
    );
}

const BrandDetailsPage = ({ setCurrentPage, ACCENT_COLOR }) => {
    const [brandName, setBrandName] = useState('');
    const [businessEmail, setBusinessEmail] = useState('');
    const [industry, setIndustry] = useState('');
    const [openIndustry, setOpenIndustry] = useState(false);
    const industryRef = useRef(null);
    const [role, setRole] = useState('brand');

    useEffect(() => {
        try {
            const r = localStorage.getItem('welcome_selected_role');
            if (r) setRole(r);
        } catch (e) {}
    }, []);

    const industryOptions = [
        'Tech & Innovation',
        'Lifestyle',
        'Gaming',
        'Education',
        'Fitness & Wellness',
        'Travel',
        'Food & Cooking',
        'Music & Arts',
        'Fashion & Beauty',
        'Business',
        'Automotive',
        'Comedy & Humor'
    ];

    useEffect(() => {
        const onClickOutside = (e) => {
            if (!openIndustry) return;
            try {
                if (industryRef.current && !industryRef.current.contains(e.target)) {
                    setOpenIndustry(false);
                }
            } catch (err) {}
        };
        window.addEventListener('click', onClickOutside);
        return () => window.removeEventListener('click', onClickOutside);
    }, [openIndustry]);

    const isValidEmail = (email) => {
        // Simple email validation
        return /\S+@\S+\.\S+/.test(email);
    };

    const canContinue = brandName.trim() !== '' && isValidEmail(businessEmail);

    const headerTitle = role === 'startup' ? t('Startup Details') : role === 'agency' ? t('Agency Details') : t('Brand Details');
    const headerSubtitle = role === 'startup' ? t('Tell us about your startup') : role === 'agency' ? t('Agency information to manage client campaigns') : t('Complete your profile to start matching');

    return (
        <div className="w-full">
            <WelcomeHeader 
                title={headerTitle} 
                subtitle={headerSubtitle} 
                setCurrentPage={setCurrentPage}
                previousPage={'Welcome'}
            />
            
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <label htmlFor="brandName" className="text-lg font-medium text-gray-900">{role === 'startup' ? t('Startup Name') : role === 'agency' ? t('Agency Name') : t('Brand Name')} <span className="text-red-500">*</span></label>
                    <input 
                        id="brandName"
                        type="text" 
                        placeholder={role === 'startup' ? t('Enter your startup name') : role === 'agency' ? t('Enter your agency name') : t('Enter your brand name')}
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-1 transition"
                    />
                </div>

                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <label htmlFor="businessEmail" className="text-lg font-medium text-gray-900">{role === 'agency' ? t('Agency Email') : t('Business Email')} <span className="text-red-500">*</span></label>
                    <input 
                        id="businessEmail"
                        type="email" 
                        placeholder={role === 'agency' ? 'agency@youragency.com' : 'hello@yourbrand.com'}
                        value={businessEmail}
                        onChange={(e) => setBusinessEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-1 transition"
                    />
                    {businessEmail && !isValidEmail(businessEmail) && (
                        <p className="text-xs text-red-500 mt-1">{t('Enter a valid business email.')}</p>
                    )}
                </div>

                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <label htmlFor="industry" className="text-lg font-medium text-gray-900">{t('Industry')}</label>
                    <div className="relative" ref={industryRef}>
                        <button
                            type="button"
                            onClick={() => setOpenIndustry((s) => !s)}
                            className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-1 transition flex items-center justify-between"
                            aria-haspopup="listbox"
                            aria-expanded={openIndustry}
                        >
                            <span className={`${industry ? 'text-gray-900' : 'text-gray-400'}`}>{t(industry) || t('Select your industry')}</span>
                            <ChevronDown className={`w-5 h-5 text-gray-400 transform ${openIndustry ? 'rotate-180' : ''}`} />
                        </button>

                        {openIndustry && (
                            <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-auto z-30">
                                {industryOptions.map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => { setIndustry(opt); setOpenIndustry(false); }}
                                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${industry === opt ? 'font-semibold bg-gray-50' : ''}`}
                                    >
                                        {t(opt)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-6">
                    <button
                        className="w-full flex items-center justify-center space-x-2 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition duration-300 hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: ACCENT_COLOR }}
                        onClick={() => setCurrentPage('BrandVoice')}
                        disabled={!canContinue}
                    >
                        <span>{t('Continue')}</span>
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                </div>
            </section>
        </div>
    );
}

const ToneOption = ({ icon: Icon, title, isSelected, onClick, ACCENT_COLOR, ICON_BACKGROUND }) => (
    <div 
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer transition duration-150 border-2`}
            style={isSelected ? { backgroundColor: HIGHLIGHT_COLOR, color: ACCENT_COLOR, borderColor: ACCENT_COLOR, boxShadow: '0 0 0 4px rgba(var(--color-gold-rgb),0.06)' } : { borderColor: '#E5E7EB' }}
    >
        <div 
            className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 ${isSelected ? '' : 'opacity-80'}`}
            style={{ backgroundColor: isSelected ? 'rgba(var(--color-gold-rgb),0.12)' : ICON_BACKGROUND }}
        >
            <Icon className="w-6 h-6" style={{ color: isSelected ? ACCENT_COLOR : '#111827' }} />
        </div>
        <p className="text-sm font-medium text-center">{title}</p>
    </div>
);


const BrandVoicePage = ({ setCurrentPage, ACCENT_COLOR, ICON_BACKGROUND }) => {
    // Dummy state for selection, using an array for multiple selection
    const [selectedTones, setSelectedTones] = useState([]);

    const toggleTone = (tone) => {
        setSelectedTones(prev => 
            prev.includes(tone) 
                ? prev.filter(t => t !== tone)
                : [...prev, tone]
        );
    };

    const tones = [
        { name: 'Formal & Professional', icon: Briefcase },
        { name: 'Witty & Playful', icon: Sparkles },
        { name: 'Experimental & Bold', icon: Lightbulb },
        { name: 'Minimalist & Clean', icon: Layers },
        { name: 'Premium & Luxe', icon: Crown },
    ];

    // Added a placeholder 'Continue' button logic similar to the design (although not visible in the image crop)
    // The design only shows the options, but for flow, we need a button. I will place it at the bottom.

    return (
        <div className="w-full">
            <WelcomeHeader 
                title={t("Brand Voice")} 
                subtitle={t("Select tones that represent your brand (select multiple)")} 
                setCurrentPage={setCurrentPage}
                previousPage={'BrandDetails'}
            />
            
            <section>
                {/* Tone options displayed in a two-column grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {tones.map(({ name, icon }) => (
                        <ToneOption 
                            key={name}
                            icon={icon}
                            title={t(name)}
                            isSelected={selectedTones.includes(name)}
                            onClick={() => toggleTone(name)}
                            ACCENT_COLOR={ACCENT_COLOR}
                            ICON_BACKGROUND={ICON_BACKGROUND}
                        />
                    ))}
                    {/* Placeholder for an odd number of items */}
                    {tones.length % 2 !== 0 && <div className="invisible"></div>}
                </div>
                
                <div className="pt-6">
                    <button
                        className="w-full flex items-center justify-center space-x-2 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition duration-300 hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: ACCENT_COLOR }}
                        onClick={() => setCurrentPage('BrandLogo')}
                        disabled={selectedTones.length === 0} // Optional: require at least one tone
                    >
                        <span>{t('Continue')}</span>
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                </div>
            </section>
        </div>
    );
}

const BrandLogoPage = ({ setCurrentPage, ACCENT_COLOR, ICON_BACKGROUND, uploadedFile, previewUrl, setUploadedFile, setPreviewUrl }) => {
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    const triggerFileInput = () => {
        try { fileInputRef.current && fileInputRef.current.click(); } catch (e) {}
    };

    const handleFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        // Validate type
        if (!file.type.startsWith('image/')) {
            setUploadError('Please upload an image file (jpg, png, gif).');
            return;
        }

        // Validate size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setUploadError('Image is too large. Max size is 5MB.');
            return;
        }

        setUploadError('');
        // read file as data URL for preview and persistence (no cropping)
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            try { setPreviewUrl(reader.result); } catch (e) {}
            try { localStorage.setItem('brand_preview_url', reader.result); } catch (e) {}
            try { setUploadedFile(file); } catch (e) {}
        });
        reader.readAsDataURL(file);
    };

    const removeUploaded = () => {
        try { localStorage.removeItem('brand_preview_url'); } catch (e) {}
        try { setPreviewUrl(''); } catch (e) {}
        try { setUploadedFile(null); } catch (e) {}
        setUploadError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const auth = useAuth();
    const navigate = useNavigate();

    const createSponsor = async () => {
        try {
            if (!auth?.user) return auth.openAuthModal();
            const name = localStorage.getItem('sponsor_name') || `Sponsor-${Date.now()}`;
            const brief = localStorage.getItem('sponsor_creative_brief') || '';
            const assets = {
                logo: localStorage.getItem('sponsor_asset_logo') || null,
                brandGuide: localStorage.getItem('sponsor_asset_brandguide') || null
            };

            // Allow sponsor account creation even if brief is not provided yet
            // (brief is optional at signup; sponsors can add it later)

            const token = localStorage.getItem('regaarder_token');
            const resp = await fetch(`${(window && window.__BACKEND_URL__) || 'https://pwin.onrender.com'}/sponsors`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ name, brief, assets })
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err && err.error ? err.error : 'Failed to create sponsor profile');
            }
            const data = await resp.json();
            try { localStorage.setItem('advertiser_profile_created','1'); } catch(e){}
            if (data && data.sponsor && data.sponsor.id) {
                try { localStorage.setItem('advertiser_sponsor_id', data.sponsor.id); } catch(e){}
            }
            // Render the dashboard view inside the Advertise app and navigate to the Advertise route
            try { setCurrentPage('AdvertiserDashboard'); } catch (e) {}
            try { navigate('/advertisewithus'); } catch (e) { /* router navigation optional */ }
        } catch (e) {
            console.error('createSponsor error', e);
            alert(e.message || 'Failed to create sponsor profile');
        }
    };

    return (
        <div className="w-full">
            <WelcomeHeader 
                title={t("Brand Logo (Optional)")} 
                subtitle={t("Help creators recognize your brand")} 
                setCurrentPage={setCurrentPage}
                previousPage={'BrandVoice'}
            />
            
            <section className="flex flex-col items-center">
                {/* Logo Upload Area */}
                <div 
                    className={`w-full py-6 px-4 sm:py-12 sm:px-6 rounded-2xl border-2 border-dashed transition duration-300 cursor-pointer text-center`} 
                    style={{ 
                        borderColor: uploadedFile ? 'rgb(220, 252, 231)' : ICON_BACKGROUND,
                        backgroundColor: uploadedFile ? '#F0FFF4' : ICON_BACKGROUND,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                    onClick={triggerFileInput}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center">
                        <div className="mb-4 w-28 h-28 rounded-full overflow-hidden bg-white flex items-center justify-center">
                            {previewUrl ? (
                                <img src={previewUrl} alt="logo preview" className="w-full h-full object-cover" />
                            ) : (
                                <Upload className="w-10 h-10 text-gray-400" />
                            )}
                        </div>

                        <p className="text-base font-medium text-gray-700">
                            {previewUrl ? (uploadedFile && uploadedFile.name ? uploadedFile.name : t('Uploaded logo')) : t('Click to upload logo')}
                        </p>

                        {uploadError && (
                            <p className="text-xs text-red-500 mt-2">{t(uploadError)}</p>
                        )}

                        {previewUrl && (
                            <div className="flex items-center space-x-3 mt-3">
                                <button
                                    type="button"
                                    onClick={removeUploaded}
                                    className="px-3 py-2 rounded-md bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    {t('Remove')}
                                </button>
                                <span className="text-xs text-gray-500">{t('Preview shown above')}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-8 w-full">
                    <button
                        className="w-full flex items-center justify-center space-x-2 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition duration-300 hover:opacity-90"
                        style={{ backgroundColor: ACCENT_COLOR }}
                        onClick={createSponsor}
                    >
                        <span>{t('Complete Setup')}</span>
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                </div>
            </section>
            {/* Note: cropping UI removed; uploads now preview directly */}
        </div>
    );
}

const AdvertiserDashboard = ({ setCurrentPage, ACCENT_COLOR, previewUrl, uploadedFile, campaigns = [], onViewCampaign, onEditCampaign }) => {
    const t = (key) => getTranslation(key, (typeof window !== 'undefined' ? localStorage.getItem('regaarder_language') : 'English') || 'English');
    const auth = useAuth();
    const [sponsorsList, setSponsorsList] = useState([]);
    // override campaignsList source if backend returns data
    const [remoteCampaigns, setRemoteCampaigns] = useState([]);
    const [showNewColl, setShowNewColl] = useState(false);
    const [showProfileCard, setShowProfileCard] = useState(() => {
        try { return localStorage.getItem('advertiser_profile_dismissed') ? false : true; } catch (e) { return true; }
    });
    const [selectedObjective, setSelectedObjective] = useState(null);
    const [showAddFunds, setShowAddFunds] = useState(false);
    const [afMethod, setAfMethod] = useState('wise');
    const [afAmount, setAfAmount] = useState('');
    const [processingAdd, setProcessingAdd] = useState(false);
    const [accountBalance, setAccountBalance] = useState(() => {
        try { return Number(localStorage.getItem('account_balance') || 0); } catch (e) { return 0; }
    });
    const [afStage, setAfStage] = useState('choose'); // choose | external | instructions | complete
    const [externalUrl, setExternalUrl] = useState('');
    const [bankDetails, setBankDetails] = useState(null);
    const [wuDetails, setWuDetails] = useState(null);
    const [afReceipt, setAfReceipt] = useState(null);
    const [afTransferNumber, setAfTransferNumber] = useState('');

    const objectives = [
        { id: 'awareness', title: 'Awareness', desc: 'Brand/product exposure to new audiences', Icon: FileText },
        { id: 'engagement', title: 'Engagement', desc: 'Challenge, hashtag trend, storytelling', Icon: Sparkles },
        { id: 'conversion', title: 'Conversion', desc: 'Product demo, affiliate link, purchases', Icon: Gift },
        { id: 'prestige', title: 'Prestige', desc: 'Long-form branded series or storytelling', Icon: Crown },
    ];

    const openNewColl = () => { setSelectedObjective(null); setShowNewColl(true); };
    const closeNewColl = () => { setShowNewColl(false); };
    const continueNewColl = () => {
        // Save the selected objective and navigate to a full-page start flow
        try { localStorage.setItem('new_coll_objective', selectedObjective || ''); } catch (e) {}
        setShowNewColl(false);
        setCurrentPage('StartCollaboration');
    };

    // Local campaigns state is persisted to localStorage.advertiser_campaigns
    const [campaignsList, setCampaignsList] = useState(() => {
        try {
            const raw = localStorage.getItem('advertiser_campaigns');
            if (raw) return JSON.parse(raw) || [];
        } catch (e) {}
        return campaigns || [];
    });

    useEffect(() => {
        const load = async () => {
            try {
                if (!auth?.user) {
                    // require authentication to view dashboard
                    auth.openAuthModal();
                    return;
                }
                const token = localStorage.getItem('regaarder_token');
                const res = await fetch(`${(window && window.__BACKEND_URL__) || 'https://pwin.onrender.com'}/advertiser/dashboard`, {
                    headers: { 'Authorization': token ? `Bearer ${token}` : '' }
                });
                if (!res.ok) {
                    console.warn('Failed to load advertiser dashboard', res.status);
                    return;
                }
                const data = await res.json();
                if (data && Array.isArray(data.sponsors)) setSponsorsList(data.sponsors || []);
                if (data && Array.isArray(data.campaigns)) setRemoteCampaigns(data.campaigns || []);
            } catch (e) { console.error(e); }
        };
        load();
    }, []);
    const [showEditCampaignModal, setShowEditCampaignModal] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);
    const [showEditDetailsInline, setShowEditDetailsInline] = useState(false);

    const saveCampaignsToStorage = (next) => {
        try { localStorage.setItem('advertiser_campaigns', JSON.stringify(next)); } catch (e) {}
        setCampaignsList(next);
    };
    // Emit a bus event so other components (like App) can sync their state
    const _saveAndEmitCampaigns = (next) => {
        saveCampaignsToStorage(next);
        try { busEmit('advertiser:campaigns_updated', next); } catch (e) {}
    };

    const openEditCampaign = (id) => {
        const c = (campaignsList || []).find(x => x.id === id) || null;
        setEditingCampaign(c ? { ...c } : { id: null, name: '', status: 'active', spent: 0, creators: 0, creatorIds: [] });
        setShowEditDetailsInline(false);
        setShowEditCampaignModal(true);
    };

    const closeEditCampaign = () => { setEditingCampaign(null); setShowEditCampaignModal(false); setShowEditDetailsInline(false); };

    const applyEditCampaign = (patch) => {
        const next = (campaignsList || []).map(c => c.id === editingCampaign.id ? { ...c, ...patch } : c);
        _saveAndEmitCampaigns(next);
        closeEditCampaign();
    };

    const deleteCampaign = (id) => {
        const next = (campaignsList || []).filter(c => c.id !== id);
        _saveAndEmitCampaigns(next);
        closeEditCampaign();
    };

    const copyCampaign = (id) => {
        const src = (campaignsList || []).find(c => c.id === id);
        if (!src) return;
        const copy = { ...src, id: `c_${Date.now()}`, name: `${src.name} (Copy)` };
        const next = [copy, ...(campaignsList || [])];
        _saveAndEmitCampaigns(next);
        closeEditCampaign();
    };

    const reuseAsTemplate = (id) => {
        try {
            const src = (campaignsList || []).find(c => c.id === id);
            if (!src) return;
            const raw = localStorage.getItem('advertiser_campaign_templates');
            let templates = [];
            if (raw) templates = JSON.parse(raw) || [];
            templates.unshift({ id: `t_${Date.now()}`, name: src.name, campaign: src, createdAt: Date.now() });
            localStorage.setItem('advertiser_campaign_templates', JSON.stringify(templates));
        } catch (e) {}
        closeEditCampaign();
    };

    return (
        <div className="w-full">
            <header className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                    <div className="sm:flex-1">
                        <div className="text-center">
                            <h2 className="text-lg font-semibold text-gray-900">{t('Advertiser Dashboard')}</h2>
                            <p className="text-sm text-gray-500">{t('Manage your collaborations')}</p>
                        </div>
                    </div>

                    <div className="mt-3 sm:mt-0 flex flex-col sm:flex-row sm:items-center sm:justify-end items-stretch gap-3">
                        <button className="w-full sm:w-auto flex items-center justify-center text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50">
                            <span className="text-sm">{t('Profile')}</span>
                        </button>

                        <button
                            onClick={openNewColl}
                            className={`w-full sm:w-auto flex items-center space-x-2 px-3 py-2 rounded-md text-white justify-center`}
                            style={{ minWidth: 0, backgroundColor: ACCENT_COLOR, boxShadow: showNewColl ? '0 0 0 4px rgba(var(--color-gold-rgb),0.16)' : undefined }}
                        >
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-semibold">{t('New Campaign')}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* New Collaboration modal / sheet */}
            {showNewColl && (
                <div className="fixed inset-0 z-50 flex flex-col">
                    <div className="bg-black/40 absolute inset-0" onClick={closeNewColl} />
                    <div className="relative bg-white w-full max-w-md mx-auto mt-12 rounded-t-xl shadow-xl overflow-hidden">
                        <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-gray-100">
                            <button onClick={closeNewColl} className="p-2 text-gray-600 hover:text-gray-900 rounded-full -ml-1">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="text-center">
                                <div className="text-sm text-gray-500">{t('Step 1 of 8')}</div>
                                <div className="w-24 mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-2 rounded-full" style={{ width: '13%', background: ACCENT_COLOR }} />
                                </div>
                            </div>
                            <div className="w-8" />
                        </div>

                        <div className="px-6 py-6">
                            <h3 className="text-2xl font-medium text-gray-900 text-center">{t('Your idea deserves great storytelling')}</h3>
                            <p className="text-sm text-gray-500 text-center mt-2 mb-6">{t('Choose what matters most for this collaboration')}</p>

                            <div className="space-y-3">
                                {objectives.map(obj => {
                                    const isSelected = selectedObjective === obj.id;
                                    return (
                                        <button
                                            key={obj.id}
                                            onClick={() => setSelectedObjective(obj.id)}
                                            className={`w-full flex items-center p-4 rounded-xl text-left transition`}
                                            style={isSelected ? { backgroundColor: HIGHLIGHT_COLOR, boxShadow: '0 0 0 2px rgba(var(--color-gold-rgb),0.12)' } : undefined}
                                        >
                                            <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4" style={{ backgroundColor: HIGHLIGHT_COLOR }}>
                                                <obj.Icon className="w-6 h-6" style={{ color: '#111827' }} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-base font-medium text-gray-900">{t(obj.title)}</div>
                                                <div className="text-sm text-gray-500 mt-1">{t(obj.desc)}</div>
                                            </div>
                                            {isSelected && (
                                                <Check className="w-5 h-5" style={{ color: ACCENT_COLOR }} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-white p-4 border-t border-gray-100">
                            <div className="max-w-md mx-auto">
                                <button
                                    onClick={continueNewColl}
                                    disabled={!selectedObjective}
                                    className={`w-full py-3 px-4 rounded-2xl text-white font-semibold`}
                                    style={{ backgroundColor: selectedObjective ? ACCENT_COLOR : undefined, color: selectedObjective ? 'white' : undefined, opacity: selectedObjective ? 1 : 0.9 }}
                                >
                                    {t('Continue')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-h-[68vh] overflow-y-auto pr-2">
                <div className="rounded-2xl p-6 mb-6" style={{ background: 'linear-gradient(180deg, var(--color-gold-light) 0%, #FFFFFF 100%)' }}>
                    <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: ACCENT_COLOR }}>
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        {showProfileCard ? (
                            <button onClick={() => { setShowProfileCard(false); }} className="text-gray-500" aria-label="Collapse profile"><ChevronUp className="w-5 h-5" /></button>
                        ) : (
                            <button onClick={() => { try { localStorage.removeItem('advertiser_profile_dismissed'); } catch(e){} setShowProfileCard(true); }} className="text-gray-500" aria-label="Show profile">
                                <ChevronDown className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {showProfileCard && (
                        <div className="flex flex-col items-center mt-6">
                        <div className="w-28 h-28 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden">
                            {previewUrl ? (
                                <img src={previewUrl} alt="brand avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                </div>
                            )}
                        </div>
                        <div className="mt-3 px-3 py-1 rounded-full text-sm" style={{ backgroundColor: ACCENT_COLOR, color: 'white' }}>{t('Brand')}</div>
                        <h3 className="mt-4 text-2xl font-semibold text-gray-900">Nnsnen</h3>
                        <p className="text-sm text-gray-500">bebsndndn</p>
                    </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-gray-500">{t('Account Balance')}</p>
                            <p className="text-2xl font-semibold" style={{ color: ACCENT_COLOR }}>${Number(accountBalance || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
                        </div>
                        <button onClick={() => setShowAddFunds(true)} className="flex items-center space-x-2 px-3 py-2 border rounded-md text-gray-700">
                            <span>{t('Add Funds')}</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div className="p-3 rounded-lg bg-gray-50">
                            <div className="text-xl sm:text-2xl font-semibold truncate" style={{ color: ACCENT_COLOR }}>0</div>
                            <div className="text-xs text-gray-500">{t('Total Campaigns')}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50">
                            <div className="text-xl sm:text-2xl font-semibold truncate" style={{ color: ACCENT_COLOR }}>0</div>
                            <div className="text-xs text-gray-500">{t('Creators Hired')}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50">
                            <div className="text-xl sm:text-2xl font-semibold truncate" style={{ color: ACCENT_COLOR }}>$0</div>
                            <div className="text-xs text-gray-500">Total Spent</div>
                        </div>
                    </div>
                </div>

            {/* Add Funds modal */}
            {showAddFunds && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddFunds(false)} />
                    <div className="relative bg-white w-full max-w-md mx-auto rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Add Funds</h3>
                            <button onClick={() => setShowAddFunds(false)} className="text-gray-500"><X className="w-5 h-5" /></button>
                        </div>

                        {afStage === 'choose' && (
                            <>
                                <p className="text-sm text-gray-500 mb-4">Choose a method to add funds to your account.</p>

                                <div className="space-y-2 mb-4">
                                    {['wise','card','payoneer','bank','western_union'].map(m => (
                                        <label key={m} className={`flex items-center p-3 rounded-lg border`} style={afMethod === m ? { backgroundColor: HIGHLIGHT_COLOR, boxShadow: '0 0 0 2px rgba(var(--color-gold-rgb),0.08)' } : undefined}>
                                            <input type="radio" name="af-method" checked={afMethod === m} onChange={() => setAfMethod(m)} className="mr-3" />
                                            <div>
                                                <div className="font-medium text-gray-900">{m === 'wise' ? 'Wise' : m === 'card' ? 'Credit / Debit Card' : m === 'payoneer' ? 'Payoneer' : m === 'bank' ? 'Bank Transfer' : 'Western Union'}</div>
                                                <div className="text-xs text-gray-500">{m === 'card' ? 'Visa, Mastercard, Amex' : m === 'bank' ? 'Direct bank transfer (ACH)' : m === 'payoneer' ? 'Payoneer transfer' : m === 'western_union' ? 'Use a Western Union location' : 'Fast bank transfers'}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <label className="block mb-4">
                                    <div className="text-sm text-gray-700">Amount</div>
                                    <input type="number" min="1" value={afAmount} onChange={(e) => setAfAmount(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="Enter amount in USD" />
                                </label>

                                <div className="flex items-center justify-end space-x-3">
                                    <button onClick={() => setShowAddFunds(false)} className="px-4 py-2 rounded-md border">Cancel</button>
                                    <button
                                        onClick={async () => {
                                            try {
                                                const amt = Math.max(0, Number(afAmount) || 0);
                                                if (!amt) return;
                                                setProcessingAdd(true);
                                                if (afMethod === 'card') {
                                                    // Simulate Stripe tokenization and server charge
                                                    const tk = await stubStripeTokenize({ amount: amt });
                                                    // Normally we'd send token to backend; here we simulate immediate success
                                                    await new Promise(r => setTimeout(r, 500));
                                                    const newBal = Number((accountBalance || 0)) + amt;
                                                    try { localStorage.setItem('account_balance', String(newBal)); } catch (e) {}
                                                    setAccountBalance(newBal);
                                                    setAfAmount('');
                                                    setAfStage('complete');
                                                } else if (afMethod === 'wise') {
                                                    const url = createWiseLink(amt);
                                                    setExternalUrl(url);
                                                    try { window.open(url, '_blank'); } catch (e) {}
                                                    setAfStage('external');
                                                } else if (afMethod === 'payoneer') {
                                                    const url = createPayoneerLink(amt);
                                                    setExternalUrl(url);
                                                    try { window.open(url, '_blank'); } catch (e) {}
                                                    setAfStage('external');
                                                } else if (afMethod === 'bank') {
                                                    const b = getBankTransferDetails(amt);
                                                    setBankDetails(b);
                                                    setAfStage('instructions');
                                                } else if (afMethod === 'western_union') {
                                                    const w = getWesternUnionInstructions(amt);
                                                    setWuDetails(w);
                                                    setAfStage('instructions');
                                                }
                                            } catch (e) {
                                                // ignore
                                            } finally { setProcessingAdd(false); }
                                        }}
                                        disabled={processingAdd || !(Number(afAmount) > 0)}
                                        className="px-4 py-2 rounded-md text-white font-semibold disabled:opacity-60"
                                        style={{ backgroundColor: ACCENT_COLOR }}
                                    >
                                        {processingAdd ? 'Processing...' : 'Proceed'}
                                    </button>
                                </div>
                            </>
                        )}

                        {afStage === 'external' && (
                            <>
                                <p className="text-sm text-gray-700 mb-3">We've opened the external provider. When your transfer completes, click the button below to simulate completion and credit your account.</p>
                                <div className="mb-4">
                                    <a href={externalUrl} target="_blank" rel="noreferrer" className="underline break-all" style={{ color: ACCENT_COLOR }}>{externalUrl}</a>
                                </div>
                                <div className="flex items-center justify-end space-x-3">
                                    <button onClick={() => setAfStage('choose')} className="px-4 py-2 rounded-md border">Back</button>
                                    <button onClick={() => {
                                        const amt = Math.max(0, Number(afAmount) || 0);
                                        if (!amt) return;
                                        const newBal = Number((accountBalance || 0)) + amt;
                                        try { localStorage.setItem('account_balance', String(newBal)); } catch (e) {}
                                        setAccountBalance(newBal);
                                        setAfAmount('');
                                        setAfStage('complete');
                                    }} className="px-4 py-2 rounded-md text-white font-semibold" style={{ backgroundColor: ACCENT_COLOR }}>Simulate Complete Transfer</button>
                                </div>
                            </>
                        )}

                        {afStage === 'instructions' && (
                            <>
                                {bankDetails && (
                                    <div className="mb-4">
                                        <div className="text-sm font-medium mb-2">Bank transfer details</div>
                                        <div className="text-xs text-gray-600">Account: {bankDetails.accountName}</div>
                                        <div className="text-xs text-gray-600">Bank: {bankDetails.bankName}</div>
                                        <div className="text-xs text-gray-600">Account #: {bankDetails.accountNumber}</div>
                                        <div className="text-xs text-gray-600">Routing: {bankDetails.routing}</div>
                                        <div className="text-xs text-gray-600">Reference: {bankDetails.reference}</div>
                                    </div>
                                )}
                                {wuDetails && (
                                    <div className="mb-4">
                                        <div className="text-sm font-medium mb-2">Western Union instructions</div>
                                        <div className="text-xs text-gray-600">Receiver: {wuDetails.receiver}</div>
                                        <div className="text-xs text-gray-600">City: {wuDetails.city}</div>
                                        <div className="text-xs text-gray-600">Country: {wuDetails.country}</div>
                                        <div className="text-xs text-gray-600">Note: {wuDetails.note}</div>
                                    </div>
                                )}

                                {/* Receipt upload and transfer number input (required for verification) */}
                                <div className="mb-4">
                                    <div className="text-sm font-medium mb-2">Upload receipt or payment confirmation</div>
                                    <input type="file" accept="image/*,application/pdf" onChange={async (e) => {
                                        try {
                                            const f = e.target.files && e.target.files[0];
                                            if (!f) return setAfReceipt(null);
                                            // Read small files as base64 for demo persistence
                                            const reader = new FileReader();
                                            reader.onload = () => {
                                                try { setAfReceipt({ name: f.name, data: reader.result }); } catch (err) {}
                                            };
                                            reader.readAsDataURL(f);
                                        } catch (err) {}
                                    }} className="w-full" />
                                    {afReceipt && <div className="text-xs text-gray-500 mt-2">Attached: {afReceipt.name}</div>}
                                </div>

                                {wuDetails && (
                                    <div className="mb-4">
                                        <div className="text-sm font-medium mb-2">Western Union MTCN / Transfer Number</div>
                                        <input value={afTransferNumber} onChange={(e) => setAfTransferNumber(e.target.value)} placeholder="Enter MTCN or transfer number" className="w-full px-3 py-2 border rounded-md" />
                                    </div>
                                )}

                                <div className="flex items-center justify-end space-x-3">
                                    <button onClick={() => setAfStage('choose')} className="px-4 py-2 rounded-md border">Back</button>
                                    <button onClick={() => {
                                        try {
                                            const amt = Math.max(0, Number(afAmount) || 0);
                                            if (!amt) return;
                                            // Require either a receipt or transfer number for WU, else accept receipt for bank
                                            if (wuDetails) {
                                                if (!afTransferNumber && !afReceipt) { alert('Please provide the MTCN (transfer number) or upload a receipt to proceed.'); return; }
                                            } else if (bankDetails) {
                                                if (!afReceipt) { alert('Please upload a receipt or confirmation for bank transfers.'); return; }
                                            }
                                            // Persist receipt metadata for demo purposes
                                            if (afReceipt) {
                                                try { localStorage.setItem('last_payment_receipt', JSON.stringify({ name: afReceipt.name, data: afReceipt.data, amount: amt, method: afMethod, time: Date.now(), transferNumber: afTransferNumber || null })); } catch (e) {}
                                            }
                                            const newBal = Number((accountBalance || 0)) + amt;
                                            try { localStorage.setItem('account_balance', String(newBal)); } catch (e) {}
                                            setAccountBalance(newBal);
                                            setAfAmount('');
                                            setAfTransferNumber('');
                                            setAfReceipt(null);
                                            setBankDetails(null);
                                            setWuDetails(null);
                                            setAfStage('complete');
                                        } catch (e) {
                                            // ignore
                                        }
                                    }} className="px-4 py-2 rounded-md text-white font-semibold" style={{ backgroundColor: ACCENT_COLOR }}>I've Sent Payment (Simulate)</button>
                                </div>
                            </>
                        )}

                        {afStage === 'complete' && (
                            <>
                                <p className="text-sm text-gray-700 mb-4">Funds have been added to your account.</p>
                                <div className="flex items-center justify-end space-x-3">
                                    <button onClick={() => { setAfStage('choose'); setShowAddFunds(false); }} className="px-4 py-2 rounded-md text-white font-semibold" style={{ backgroundColor: ACCENT_COLOR }}>Done</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

                <h4 className="text-lg font-semibold mb-3">{t('Your Campaigns')} <span className="text-sm text-gray-400">{(campaignsList || []).length} {t('total')}</span></h4>
                <div className="space-y-3">
                    {(campaignsList || []).map(c => (
                        <div key={c.id} className="p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                            <div>
                                <div className="text-base font-medium">{c.name || t('Campaign')}</div>
                                <div className="text-xs text-gray-500">{t(c.status)}</div>
                                <div className="text-xs text-gray-400 mt-1">${c.spent} · {c.creators} {t('creators')}</div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => { /* View opens the inline editor modal */ openEditCampaign(c.id); }} className="px-3 py-1 rounded-md bg-gray-50 text-sm">{t('View')}</button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Inline Edit Modal (title-only + actions) */}
                {showEditCampaignModal && editingCampaign && createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/40" onClick={closeEditCampaign} />
                        <div className="relative bg-white w-full max-w-md mx-auto rounded-xl shadow-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">{t('Edit Campaign')}</h3>
                                <button onClick={closeEditCampaign} className="text-gray-500"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="mb-4">
                                    <label className="block text-sm text-gray-700 mb-2">{t('Title')}</label>
                                    <input value={editingCampaign.name || ''} onChange={(e) => setEditingCampaign(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border rounded-md" />
                                    <div className="text-xs text-gray-500 mt-2">{t('Only the campaign title is editable here. Use "Edit Details" to change payment or other fields inline.')}</div>
                                </div>

                                {/* Creators shown naturally in modal */}
                                <div className="mb-4">
                                    <div className="text-sm text-gray-700 mb-2">{t('Creators')}</div>
                                    <div className="flex flex-wrap gap-2">
                                        {((editingCampaign ? (Array.isArray(editingCampaign.creatorIds) ? editingCampaign.creatorIds : (function(){ try { const r = localStorage.getItem('matched_selected_creator_ids') || localStorage.getItem('sponsor_selected_ids'); if (r) { const a = JSON.parse(r); if (Array.isArray(a)) return a; } return []; } catch(e){ return []; } })()) : [])).map((id, idx) => (
                                            <div key={id + '_' + idx} className="px-2 py-1 bg-gray-100 text-xs rounded-full">{String(id)}</div>
                                        ))}
                                    </div>
                                </div>

                                {/* Show basic campaign metadata for quick inspection */}
                                    <div className="mb-4 p-3 rounded-md bg-gray-50 border text-sm text-gray-700">
                                    <div className="flex items-center justify-between"><div className="text-xs text-gray-500">{t('Status')}</div><div className="font-medium">{t(editingCampaign.status)}</div></div>
                                    <div className="flex items-center justify-between mt-2"><div className="text-xs text-gray-500">{t('Budget')}</div><div className="font-medium">${Number(localStorage.getItem('sponsor_budget_cap') || editingCampaign.spent || 0).toLocaleString()}</div></div>
                                    <div className="flex items-center justify-between mt-2"><div className="text-xs text-gray-500">{t('Creators Hired')}</div><div className="font-medium">{editingCampaign.creators || Number(localStorage.getItem('sponsor_selected_count') || 0)}</div></div>
                                    <div className="flex items-center justify-between mt-2"><div className="text-xs text-gray-500">{t('Est. Reach')}</div><div className="font-medium">{(localStorage.getItem('sponsor_estimated_reach') ? formatCompact(Number(localStorage.getItem('sponsor_estimated_reach'))) + ' ' + t('views') : 'N/A')}</div></div>
                                    <div className="flex items-center justify-between mt-2"><div className="text-xs text-gray-500">{t('Escrow')}</div><div className="font-medium">${Number(localStorage.getItem('sponsor_escrow_amount') || editingCampaign.spent || 0).toLocaleString()}</div></div>
                                </div>

                                <div className="flex items-center justify-between space-x-2">
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => { applyEditCampaign({ name: editingCampaign.name || 'Campaign' }); }} className="px-4 py-2 rounded-md text-white" style={{ backgroundColor: ACCENT_COLOR }}>{t('Save')}</button>
                                        <button onClick={() => { if (confirm(t('Delete this campaign? This cannot be undone.'))) deleteCampaign(editingCampaign.id); }} className="px-4 py-2 rounded-md border text-sm">{t('Delete')}</button>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => { copyCampaign(editingCampaign.id); }} className="px-3 py-2 rounded-md bg-gray-100">{t('Copy')}</button>
                                        <button onClick={() => { reuseAsTemplate(editingCampaign.id); }} className="px-3 py-2 rounded-md bg-gray-100">{t('Reuse as Template')}</button>
                                    </div>
                                </div>

                                <div className="mt-4 border-t pt-4">
                                    {!showEditDetailsInline ? (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => { setShowEditDetailsInline(true); }} className="px-3 py-2 rounded-md bg-white border">{t('Edit Details')}</button>
                                            </div>
                                            <div className="text-xs text-gray-500">{t('Tap "Edit Details" to edit payment, creators and budget inline.')}</div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="mb-3">
                                                <label className="text-xs text-gray-500">{t('Add Creator ID')}</label>
                                                <div className="flex items-center mt-2">
                                                    <input placeholder={t("creator id")} className="px-2 py-1 border rounded-l-md flex-1" id="newCreatorIdInput" />
                                                    <button onClick={() => {
                                                        try {
                                                            const el = document.getElementById('newCreatorIdInput');
                                                            const v = (el && el.value) ? String(el.value).trim() : '';
                                                            if (!v) return;
                                                            const nextIds = Array.isArray(editingCampaign.creatorIds) ? [...editingCampaign.creatorIds, v] : [v];
                                                            setEditingCampaign(prev => ({ ...prev, creatorIds: nextIds, creators: nextIds.length }));
                                                            if (el) el.value = '';
                                                        } catch(e){}
                                                    }} className="px-3 py-1 bg-gray-100 border rounded-r-md">{t('Add')}</button>
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <label className="text-xs text-gray-500">{t('Budget Cap')}</label>
                                                <input type="number" value={editingCampaign.budgetCap || ''} onChange={(e) => setEditingCampaign(prev => ({ ...prev, budgetCap: e.target.value }))} className="w-full px-2 py-1 border rounded-md mt-1" />
                                            </div>
                                            <div className="mb-3">
                                                <label className="text-xs text-gray-500">{t('Escrow Amount')}</label>
                                                <input type="number" value={editingCampaign.escrowAmount || ''} onChange={(e) => setEditingCampaign(prev => ({ ...prev, escrowAmount: e.target.value }))} className="w-full px-2 py-1 border rounded-md mt-1" />
                                            </div>
                                            <div className="flex items-center justify-end space-x-2">
                                                <button onClick={() => setShowEditDetailsInline(false)} className="px-3 py-2 rounded-md border">Cancel</button>
                                                <button onClick={() => { try { applyEditCampaign({ creatorIds: editingCampaign.creatorIds || [], budgetCap: editingCampaign.budgetCap || null, escrowAmount: editingCampaign.escrowAmount || null, creators: (Array.isArray(editingCampaign.creatorIds) ? editingCampaign.creatorIds.length : editingCampaign.creators || 0) }); setShowEditDetailsInline(false); } catch(e){} }} className="px-3 py-2 rounded-md text-white" style={{ backgroundColor: ACCENT_COLOR }}>Save Details</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                        </div>
                    </div>, document.body) }
                <div className="h-8" />
            </div>
        </div>
    );
}

const CampaignDetails = ({ setCurrentPage, campaign, onSave, readOnly }) => {
    const [form, setForm] = useState(campaign || { id: null, name: '', status: '', spent: 0, creators: 0 });
    useEffect(() => setForm(campaign || { id: null, name: '', status: '', spent: 0, creators: 0 }), [campaign]);

    if (!campaign) return (
        <div>
            <p className="text-sm text-gray-500">Campaign not found.</p>
            <div className="pt-4">
                <button onClick={() => setCurrentPage('AdvertiserDashboard')} className="px-3 py-2 rounded-md border">Back</button>
            </div>
        </div>
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold">{campaign.name}</h2>
                    <p className="text-sm text-gray-500">Campaign details</p>
                </div>
                <div>
                    <button onClick={() => setCurrentPage('AdvertiserDashboard')} className="px-3 py-2 rounded-md border">Back</button>
                </div>
            </div>

            <section className="space-y-4">
                <label className="block">
                    <div className="text-sm text-gray-700">Name</div>
                    {readOnly ? (
                        <div className="w-full px-3 py-2 border rounded-md bg-gray-50">{campaign.name}</div>
                    ) : (
                        <input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border rounded-md" />
                    )}
                </label>
                <label className="block">
                    <div className="text-sm text-gray-700">Status</div>
                    {readOnly ? (
                        <div className="w-full px-3 py-2 border rounded-md bg-gray-50">{campaign.status}</div>
                    ) : (
                        <select value={form.status} onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
                            <option value="active">active</option>
                            <option value="paused">paused</option>
                            <option value="completed">completed</option>
                        </select>
                    )}
                </label>
                <label className="block">
                    <div className="text-sm text-gray-700">Budget Spent</div>
                    {readOnly ? (
                        <div className="w-full px-3 py-2 border rounded-md bg-gray-50">${campaign.spent}</div>
                    ) : (
                        <input type="number" value={form.spent} onChange={(e) => setForm(prev => ({ ...prev, spent: Number(e.target.value) }))} className="w-full px-3 py-2 border rounded-md" />
                    )}
                </label>
                <label className="block">
                    <div className="text-sm text-gray-700">Creators Hired</div>
                    {readOnly ? (
                        <div className="w-full px-3 py-2 border rounded-md bg-gray-50">{campaign.creators}</div>
                    ) : (
                        <input type="number" value={form.creators} onChange={(e) => setForm(prev => ({ ...prev, creators: Number(e.target.value) }))} className="w-full px-3 py-2 border rounded-md" />
                    )}
                </label>

                <div className="flex items-center space-x-3 pt-4">
                    {readOnly ? (
                        <button onClick={() => setCurrentPage('AdvertiserDashboard')} className="px-4 py-2 rounded-md border">Close</button>
                    ) : (
                        <>
                            <button onClick={() => { onSave && onSave(form); setCurrentPage('AdvertiserDashboard'); }} className="px-4 py-2 rounded-md text-white" style={{ backgroundColor: ACCENT_COLOR }}>Save</button>
                            <button onClick={() => setCurrentPage('AdvertiserDashboard')} className="px-4 py-2 rounded-md border">Cancel</button>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
};

// Start Collaboration Page (full-page version of the modal flow)
const StartCollaboration = ({ setCurrentPage, ACCENT_COLOR }) => {
    const t = (key) => getTranslation(key, (typeof window !== 'undefined' ? localStorage.getItem('regaarder_language') : 'English') || 'English');
    const [objective, setObjective] = useState('');
    const [selectedOption, setSelectedOption] = useState('');

    // Do not auto-load objective from localStorage here; Step 2 should be
    // independent of Step 1. The objective chosen in Step 1 is persisted
    // but should not alter the available options or routing in Step 2.

    // Options shown when objective is awareness
    const awarenessOptions = [
        {
            id: 'content_integration',
            title: t('Content Integration'),
            desc: t('Direct sponsorship with creators. Choose from native mentions, integrated segments, product placements, and custom collaborations. Perfect for brand storytelling.'),
            bullets: [t('Native mentions'), t('Integrated segments'), t('Product placement')],
            Icon: FileText
        },
        {
            id: 'post_sponsored',
            title: t('Post Sponsored Request'),
            desc: t('Create a sponsored request and let creators apply. Set your budget, requirements, and deadline. Review applications and choose the best creators for your brand.'),
            bullets: [t('Creators apply'), t('Competitive bids'), t('Sponsored tag')],
            Icon: FileEdit
        },
        {
            id: 'sponsor_user_requests',
            title: t('Sponsor User Requests'),
            desc: t('Browse existing video requests from users on the platform. Sponsor content that aligns with your brand and reach engaged audiences looking for that content.'),
            bullets: [t('Browse requests'), t('Sponsor matching content')],
            Icon: Eye
        },
    ];

    const handleContinue = () => {
        try { localStorage.setItem('start_coll_choice', selectedOption || ''); } catch (e) {}
        // Route based on the selected option regardless of the previously chosen objective.
        try {
            if (selectedOption === 'content_integration') {
                setCurrentPage('SponsorshipFormat');
                return;
            }
            if (selectedOption === 'post_sponsored') {
                try { window.location.href = '/ideas'; } catch (e) { setCurrentPage('Ideas'); }
                return;
            }
            if (selectedOption === 'sponsor_user_requests') {
                setCurrentPage('SponsorUserRequests');
                return;
            }
        } catch (e) {}
        // If a valid option was selected but not explicitly handled above,
        // default to the sponsorship flow so users don't get sent back to Welcome.
        if (selectedOption) {
            setCurrentPage('SponsorshipFormat');
        } else {
            setCurrentPage('Welcome');
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <button onClick={() => setCurrentPage('AdvertiserDashboard')} className="text-gray-600 hover:text-gray-900 p-2 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-sm text-gray-500">{t('Step 2 of 8')}</div>
                <div className="text-sm text-gray-500">{t('25% complete')}</div>
            </div>

            <div className="w-full mb-6">
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full" style={{ width: '25%', background: ACCENT_COLOR }} />
                </div>
            </div>

            <div className="text-center mb-6">
                <h1 className="text-2xl font-medium text-gray-900">{t('How would you like to work with creators?')}</h1>
                <p className="text-sm text-gray-500 mt-2">{t('Choose the best approach for your campaign')}</p>
            </div>

            {/* Selection options */}
            <div className="space-y-4">
                {awarenessOptions.map(opt => {
                    const Icon = opt.Icon;
                    const isSelected = selectedOption === opt.id;
                    return (
                        <button
                            key={opt.id}
                            onClick={() => setSelectedOption(opt.id)}
                            className={`w-full text-left p-6 rounded-2xl transition`}
                            style={isSelected ? { backgroundColor: HIGHLIGHT_COLOR, boxShadow: '0 0 0 2px rgba(var(--color-gold-rgb),0.12)' } : undefined}
                        >
                            <div className="flex items-start">
                                <div className="w-14 h-14 rounded-lg flex items-center justify-center mr-6" style={{ backgroundColor: HIGHLIGHT_COLOR }}>
                                    <Icon className="w-6 h-6" />
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-lg font-medium text-gray-900">{opt.title}</div>
                                            <div className="text-sm text-gray-500 mt-1 max-w-[56ch]">{opt.desc}</div>
                                        </div>
                                        <div className="ml-4">
                                            {isSelected && <Check className="w-5 h-5" style={{ color: ACCENT_COLOR }} />}
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-gray-600">
                                        {opt.bullets.map(b => (
                                            <div key={b} className="flex items-center space-x-3">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                                <span>{b}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Continue CTA button */}
            <ContinueCTA disabled={!selectedOption} onClick={handleContinue} ACCENT_COLOR={ACCENT_COLOR} />
        </div>
    );
};

// Sponsorship format selection (shown when Content Integration is chosen)
const SponsorshipFormat = ({ setCurrentPage, ACCENT_COLOR }) => {
    const t = (key) => getTranslation(key, (typeof window !== 'undefined' ? localStorage.getItem('regaarder_language') : 'English') || 'English');
    const formats = [
        { id: 'native', title: t('Native Mention'), desc: t('15-30s organic shoutout'), duration: t('15-30s'), Icon: FileText },
        { id: 'integrated', title: t('Integrated Segment'), desc: t('Product use or feature showcase'), duration: t('30-60s'), Icon: Sparkles },
        { id: 'challenge', title: t('Challenge / Request'), desc: t('Interactive trend or challenge'), duration: t('60s+'), Icon: Gift },
        { id: 'background', title: t('Background Placement'), desc: t('Subtle visual appearance'), duration: t('Throughout'), Icon: Eye },
        { id: 'custom', title: t('Custom Collaboration'), desc: t('Open brief, creative freedom'), duration: t('Flexible'), Icon: HeartHandshake },
    ];

    const [selected, setSelected] = useState('');

    // initialize from persisted choice when available
    useEffect(() => {
        try {
            const stored = localStorage.getItem('sponsor_selected_format');
            if (stored) setSelected(stored);
        } catch (e) {}
    }, []);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-3">
                <button onClick={() => setCurrentPage('StartCollaboration')} className="text-gray-600 hover:text-gray-900 p-2 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-sm text-gray-500">{t('Step 3 of 8')}</div>
                <div className="text-sm text-gray-500">{t('38% complete')}</div>
            </div>

            <div className="w-full mb-4">
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full" style={{ width: '38%', background: ACCENT_COLOR }} />
                </div>
            </div>

            <div className="mb-4 flex items-center text-gray-600 space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3zM5 20v-2a4 4 0 014-4h6a4 4 0 014 4v2"/></svg>
                <div className="text-sm font-medium">{t("Don't lose your progress!")}</div>
            </div>

            <div className="text-center mb-6">
                <h1 className="text-2xl font-medium text-gray-900">{t('Choose your sponsorship format')}</h1>
                <p className="text-sm text-gray-500 mt-2">{t('How should creators feature your brand?')}</p>
            </div>

            <div className="space-y-4 pb-36 animate-in fade-in slide-in-from-bottom-4 duration-500">{/* extra bottom padding so content scrolls above sticky button */}
                {formats.map((f, index) => {
                    const Icon = f.Icon;
                    const isSelected = selected === f.id;
                    return (
                        <button
                            key={f.id}
                            onClick={() => setSelected(f.id)}
                            className={`w-full text-left p-6 rounded-2xl transition animate-in fade-in slide-in-from-bottom-2 duration-500`}
                            style={isSelected ? { backgroundColor: HIGHLIGHT_COLOR, boxShadow: '0 0 0 2px rgba(var(--color-gold-rgb),0.12)', animationDelay: `${index * 50}ms` } : { animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start">
                                <div className="w-14 h-14 rounded-lg flex items-center justify-center mr-6" style={{ backgroundColor: HIGHLIGHT_COLOR }}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-lg font-medium text-gray-900">{f.title}</div>
                                    <div className="text-sm text-gray-500 mt-1">{f.desc}</div>
                                    <div className="text-sm text-gray-400 mt-3 flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3"/></svg>
                                        <span>{f.duration}</span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Continue CTA button */}
            <ContinueCTA disabled={!selected} onClick={() => {
                try { localStorage.setItem('sponsor_open_budget', '1'); } catch (e) {}
                try { localStorage.setItem('sponsor_selected_format', selected || ''); } catch (e) {}
                // Also store a human readable title for the chosen format so summaries can display it
                try {
                    const chosen = formats.find(f => f.id === selected);
                    if (chosen) localStorage.setItem('sponsor_selected_format_title', chosen.title || chosen.id);
                } catch (e) {}
                setCurrentPage('SponsorUserRequests');
            }} ACCENT_COLOR={ACCENT_COLOR} />
        </div>
    );
};

// Page shown when user selects 'Sponsor User Requests'
const SponsorUserRequests = ({ setCurrentPage, ACCENT_COLOR }) => {
    const t = (key) => getTranslation(key, (typeof window !== 'undefined' ? localStorage.getItem('regaarder_language') : 'English') || 'English');
    const [showBudget, setShowBudget] = useState(false);
    // If navigation requested opening budget directly, check flag from localStorage
    useEffect(() => {
        try {
            const v = localStorage.getItem('sponsor_open_budget');
            if (v) {
                setShowBudget(true);
                localStorage.removeItem('sponsor_open_budget');
            }
        } catch (e) {}
    }, []);
    // No inline request previews here ??selection happens on the Requests marketplace.
    const [selectedModel, setSelectedModel] = useState('CPM');
    // Lump sum state
    const [lumpBudget, setLumpBudget] = useState(100);

    // CPM state (rate per 1,000 views and budget)
    const [cpmRate, setCpmRate] = useState(5); // dollars per 1000
    const CPM_RATE_MIN = 5;
    const CPM_RATE_MAX = 100;

    const [cpmBudget, setCpmBudget] = useState(5000);
    const CPM_BUDGET_MIN = 500;
    const CPM_BUDGET_MAX = 100000;

    // CPM engagement bonus
    const [cpmBonusPct, setCpmBonusPct] = useState(5);
    const CPM_BONUS_MIN = 0;
    const CPM_BONUS_MAX = 20;

    // Helper to style range inputs with a colored fill based on value (uses site progress blue)
    const rangeFillStyle = (value, min, max) => {
        const v = Number(value);
        const mn = Number(min);
        const mx = Number(max);
        const pct = mx === mn ? 0 : Math.round(((v - mn) / (mx - mn)) * 100);
        return { background: `linear-gradient(90deg, ${PROGRESS_BLUE} ${pct}%, #e6e7eb ${pct}%)` };
    };
    // CPC / Budget state
    const [cpcRate, setCpcRate] = useState(0.5); // dollars
    const CPC_RATE_MIN = 0.1;
    const CPC_RATE_MAX = 10.0;

    const [cpcBudget, setCpcBudget] = useState(100);
    const CPC_BUDGET_MIN = 100;
    const CPC_BUDGET_MAX = 100000;

    const [bonusEnabled, setBonusEnabled] = useState(true);
    const [bonusPct, setBonusPct] = useState(5);
    const BONUS_MIN = 0;
    const BONUS_MAX = 50;

    // Selection is handled in the Requests marketplace; this view is informational.

    // If user tapped continue (from the initial view), show the in-place budget selection page
    if (showBudget) {
        return (
            <div className="pt-6 pb-40 max-w-md mx-auto px-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-500">Step 4 of 6</div>
                    <div className="text-sm text-gray-500">67% complete</div>
                </div>

                <div className="h-2 rounded-full mb-6 overflow-hidden" style={{ background: '#f3f2f1' }}>
                    <div className="h-full" style={{ width: '67%', background: ACCENT_COLOR }}></div>
                </div>

                <h1 className="text-2xl font-semibold text-gray-900 mb-3">{t('Configure sponsorship budget')}</h1>
                <p className="text-sm text-gray-600 mb-6">{t('Choose how you want to pay for sponsored content')}</p>

                <h3 className="text-sm font-medium text-gray-800 mb-3">{t('Payment Model')}</h3>

                <div className="space-y-4">
                    <button
                        onClick={() => setSelectedModel('Lump')}
                        className={`w-full text-left p-4 rounded-2xl border bg-white shadow-sm flex justify-between items-start`}
                        style={selectedModel === 'Lump' ? { borderColor: ACCENT_COLOR } : undefined}
                    >
                        <div>
                            <div className="text-lg font-medium text-gray-900">{t('Lump Sum Payment')}</div>
                            <div className="text-sm text-gray-500">{t('Pay a fixed amount per sponsored video. Simple and predictable.')}</div>
                        </div>
                        <div className="ml-4" style={{ color: ACCENT_COLOR }}>
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </button>

                    <button
                        onClick={() => setSelectedModel('CPM')}
                        className={`w-full text-left p-4 rounded-2xl border bg-white shadow-sm flex justify-between items-start`}
                        style={selectedModel === 'CPM' ? { borderColor: ACCENT_COLOR, boxShadow: '0 0 0 4px rgba(var(--color-gold-rgb),0.04)', backgroundColor: HIGHLIGHT_COLOR } : undefined}
                    >
                        <div>
                            <div className="text-lg font-medium text-gray-900">{t('Pay Per View (CPM)')}</div>
                            <div className="text-sm text-gray-500">{t('Pay based on video views. Only pay for actual reach. Fair for creators.')}</div>
                        </div>
                        <div className="ml-4" style={{ color: ACCENT_COLOR }}>
                            <Eye className="w-6 h-6" />
                        </div>
                    </button>

                    <button
                        onClick={() => setSelectedModel('CPC')}
                        className={`w-full text-left p-4 rounded-2xl border bg-white shadow-sm flex justify-between items-start`}
                        style={selectedModel === 'CPC' ? { borderColor: ACCENT_COLOR } : undefined}
                    >
                        <div>
                            <div className="text-lg font-medium text-gray-900">{t('Pay Per Click (CPC)')}</div>
                            <div className="text-sm text-gray-500">{t('Pay only when viewers click your product or link.')}</div>
                        </div>
                        <div className="ml-4" style={{ color: ACCENT_COLOR }}>
                            <MousePointerClick className="w-6 h-6" />
                        </div>
                    </button>

                    {/* When Lump Sum is selected, show the budget controls directly above the escrow card */}
                    {selectedModel === 'Lump' && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-lg font-medium text-gray-900">{t('Budget per Request')}</h4>
                                <div className="text-xl font-semibold" style={{ color: ACCENT_COLOR }}>${lumpBudget.toLocaleString()}</div>
                            </div>

                            <div className="mt-3">
                                <input
                                    type="range"
                                    min={100}
                                    max={100000}
                                    step={1}
                                    value={lumpBudget}
                                    onChange={(e) => setLumpBudget(Math.max(100, Math.min(100000, Number(e.target.value))))}
                                    className="w-full h-2 rounded-full appearance-none bg-gray-200"
                                    style={rangeFillStyle(lumpBudget, 100, 100000)}
                                />
                                <div className="flex justify-between text-sm text-gray-500 mt-2">
                                    <span>$100</span>
                                    <span>$100,000</span>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="text-sm text-gray-500 mb-2">{t('Or enter custom amount (minimum $100)')}</div>
                                <div className="w-full">
                                        <div className="border border-gray-100 rounded-md p-3 bg-white">
                                            <span className="text-gray-500 mr-3">$</span>
                                            <input
                                                type="number"
                                                min={100}
                                                value={lumpBudget}
                                                onChange={(e) => {
                                                    const n = Number(e.target.value);
                                                    if (Number.isNaN(n)) return;
                                                    setLumpBudget(Math.max(100, Math.min(100000, Math.floor(n))));
                                                }}
                                                className="w-36 outline-none text-lg font-medium"
                                            />
                                        </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedModel === 'CPM' && (
                        <div className="mt-4 space-y-6">
                            {/* Rate per 1,000 views */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-medium text-gray-900">{t('Rate per 1,000 views')}</h4>
                                    <div className="text-xl font-semibold" style={{ color: ACCENT_COLOR }}>${cpmRate.toFixed(2)}</div>
                                </div>

                                <div className="mt-3">
                                    <input
                                        type="range"
                                        min={CPM_RATE_MIN}
                                        max={CPM_RATE_MAX}
                                        step={0.5}
                                        value={cpmRate}
                                        onChange={(e) => setCpmRate(Math.max(CPM_RATE_MIN, Math.min(CPM_RATE_MAX, Number(e.target.value))))}
                                        className="w-full h-2 rounded-full appearance-none bg-gray-200"
                                        style={rangeFillStyle(cpmRate, CPM_RATE_MIN, CPM_RATE_MAX)}
                                    />
                                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                                        <span>${CPM_RATE_MIN} (minimum)</span>
                                        <span>${CPM_RATE_MAX}</span>
                                    </div>
                                    {/* numeric input removed: top amount displays current rate */}
                                </div>

                                <div className="mt-4 p-3 rounded-lg bg-gray-50 text-sm text-gray-600 flex items-start">
                                    <div className="w-7 h-7 rounded-md flex items-center justify-center mr-3" style={{ color: ACCENT_COLOR }}>
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>{t('Minimum $5 CPM protects creator earnings and ensures fair compensation')}</div>
                                </div>
                            </div>

                            {/* Budget Cap */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-medium text-gray-900">{t('Budget Cap')}</h4>
                                    <div className="text-xl font-semibold" style={{ color: ACCENT_COLOR }}>${cpmBudget.toLocaleString()}</div>
                                </div>

                                <div className="mt-3">
                                    <input
                                        type="range"
                                        min={CPM_BUDGET_MIN}
                                        max={CPM_BUDGET_MAX}
                                        step={1}
                                        value={cpmBudget}
                                        onChange={(e) => setCpmBudget(Math.max(CPM_BUDGET_MIN, Math.min(CPM_BUDGET_MAX, Number(e.target.value))))}
                                        className="w-full h-2 rounded-full appearance-none bg-gray-200"
                                        style={rangeFillStyle(cpmBudget, CPM_BUDGET_MIN, CPM_BUDGET_MAX)}
                                    />
                                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                                        <span>${CPM_BUDGET_MIN} (minimum)</span>
                                        <span>${CPM_BUDGET_MAX}</span>
                                    </div>
                                    {/* numeric box removed: header shows the live budget and custom input is below */}
                                </div>

                                <div className="mt-4">
                                    <div className="text-sm text-gray-500 mb-2">{t('Or enter custom amount (minimum $500)')}</div>
                                    <div className="w-full">
                                        <div className="border border-gray-100 rounded-md p-3 bg-white">
                                            <span className="text-gray-500 mr-3">$</span>
                                            <input
                                                type="number"
                                                min={CPM_BUDGET_MIN}
                                                value={cpmBudget}
                                                onChange={(e) => {
                                                    const n = Number(e.target.value);
                                                    if (Number.isNaN(n)) return;
                                                    setCpmBudget(Math.max(CPM_BUDGET_MIN, Math.min(CPM_BUDGET_MAX, Math.floor(n))));
                                                }}
                                                className="w-36 outline-none text-lg font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-3">{t('Maximum you\'ll pay regardless of views. Payment will be held in escrow upfront.')}</p>
                            </div>

                            {/* Automatic Engagement Bonus */}
                                <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start">
                                        <input type="checkbox" defaultChecked className="w-5 h-5 mr-3" />
                                        <div>
                                            <div className="text-lg font-medium text-gray-900">{t('Automatic Engagement Bonus')}</div>
                                            <div className="text-sm text-gray-600 mt-1">{t('Reward creators for high engagement (likes, comments, shares)')}</div>
                                        </div>
                                    </div>
                                    <div className="font-semibold" style={{ color: ACCENT_COLOR }}><Zap className="w-5 h-5" /></div>
                                </div>

                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm text-gray-900">{t('Bonus Percentage')}</div>
                                        <div className="font-semibold" style={{ color: ACCENT_COLOR }}>+5%</div>
                                    </div>
                                    <input
                                        type="range"
                                        min={CPM_BONUS_MIN}
                                        max={CPM_BONUS_MAX}
                                        step={1}
                                        value={cpmBonusPct}
                                        onChange={(e) => setCpmBonusPct(Math.max(CPM_BONUS_MIN, Math.min(CPM_BONUS_MAX, Number(e.target.value))))}
                                        className="w-full h-2 rounded-full appearance-none bg-gray-200"
                                    />
                                    {/* numeric box removed: header shows the live bonus percentage */}
                                    <p className="text-sm text-gray-500 mt-3">{t('Creators earn an extra {0}% if engagement rate exceeds 10%').replace('{0}', cpmBonusPct)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {selectedModel === 'CPC' && (
                        <div className="mt-4 space-y-6">
                            {/* Rate per Click */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-medium text-gray-900">{t('Rate per Click')}</h4>
                                    <div className="text-xl font-semibold" style={{ color: ACCENT_COLOR }}>${cpcRate.toFixed(2)}</div>
                                </div>

                                <div className="mt-3">
                                    <input
                                        type="range"
                                        min={CPC_RATE_MIN}
                                        max={CPC_RATE_MAX}
                                        step="0.01"
                                        value={cpcRate}
                                        onChange={(e) => {
                                            const v = Math.max(CPC_RATE_MIN, Math.min(CPC_RATE_MAX, Number(e.target.value)));
                                            setCpcRate(Math.round(v * 100) / 100);
                                        }}
                                        className="w-full h-2 rounded-full appearance-none bg-gray-200"
                                        style={rangeFillStyle(cpcRate, CPC_RATE_MIN, CPC_RATE_MAX)}
                                    />
                                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                                        <span>${CPC_RATE_MIN.toFixed(2)} (minimum)</span>
                                        <span>${CPC_RATE_MAX.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* exact-rate numeric input removed: top amount displays current CPC rate */}

                                <p className="mt-3 text-sm text-gray-600 flex items-center"><Shield className="w-4 h-4 mr-2 text-gray-400" />{t('Minimum {0} per click ensures fair creator compensation').replace('{0}', '$' + CPC_RATE_MIN.toFixed(2))}</p>
                            </div>

                            {/* CPC image examples removed (not needed) */}

                            {/* Budget Cap */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-medium text-gray-900">{t('Budget Cap')}</h4>
                                    <div className="text-xl font-semibold" style={{ color: ACCENT_COLOR }}>${cpcBudget.toLocaleString()}</div>
                                </div>

                                <div className="mt-3">
                                    <input
                                        type="range"
                                        min={CPC_BUDGET_MIN}
                                        max={CPC_BUDGET_MAX}
                                        step={1}
                                        value={cpcBudget}
                                        onChange={(e) => setCpcBudget(Math.max(CPC_BUDGET_MIN, Math.min(CPC_BUDGET_MAX, Number(e.target.value))))}
                                        className="w-full h-2 rounded-full appearance-none bg-gray-200"
                                        style={rangeFillStyle(cpcBudget, CPC_BUDGET_MIN, CPC_BUDGET_MAX)}
                                    />
                                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                                        <span>${CPC_BUDGET_MIN} (minimum)</span>
                                        <span>${CPC_BUDGET_MAX.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <div className="text-sm text-gray-500 mb-2">{t('Or enter custom amount (minimum {0})').replace('{0}', '$' + CPC_BUDGET_MIN)}</div>
                                    <div className="w-full">
                                        <div className="border border-gray-100 rounded-md p-3 bg-white">
                                            <span className="text-gray-500 mr-3">$</span>
                                            <input
                                                type="number"
                                                min={CPC_BUDGET_MIN}
                                                value={cpcBudget}
                                                onChange={(e) => {
                                                    const n = Number(e.target.value);
                                                    if (Number.isNaN(n)) return;
                                                    setCpcBudget(Math.max(CPC_BUDGET_MIN, Math.min(CPC_BUDGET_MAX, Math.floor(n))));
                                                }}
                                                className="w-36 outline-none text-lg font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-500 mt-3">{t('Maximum you\'ll pay regardless of clicks. Payment will be held in escrow upfront.')}</p>
                            </div>

                            {/* Automatic Engagement Bonus */}
                            <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start">
                                        <input type="checkbox" checked={bonusEnabled} onChange={(e) => setBonusEnabled(e.target.checked)} className="w-5 h-5 mr-3" />
                                        <div>
                                            <div className="text-lg font-medium text-gray-900">{t('Automatic Engagement Bonus')}</div>
                                            <div className="text-sm text-gray-600 mt-1">{t('Reward creators for high engagement (likes, comments, shares)')}</div>
                                        </div>
                                    </div>
                                    <div className="font-semibold" style={{ color: ACCENT_COLOR }}><Zap className="w-5 h-5" /></div>
                                </div>

                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm text-gray-900">{t('Bonus Percentage')}</div>
                                        <div className="font-semibold" style={{ color: ACCENT_COLOR }}>+{bonusPct}%</div>
                                    </div>
                                    <input
                                        type="range"
                                        min={BONUS_MIN}
                                        max={BONUS_MAX}
                                        step="1"
                                        value={bonusPct}
                                        onChange={(e) => setBonusPct(Math.max(BONUS_MIN, Math.min(BONUS_MAX, Number(e.target.value))))}
                                        className="w-full h-2 rounded-full appearance-none bg-gray-200"
                                        style={rangeFillStyle(bonusPct, BONUS_MIN, BONUS_MAX)}
                                    />
                                    {/* numeric box removed: header shows live bonus percentage */}

                                    <p className="text-sm text-gray-500 mt-3">{t('Creators earn an extra {0}% if engagement rate exceeds 10%').replace('{0}', bonusPct)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Escrow card (always visible) */}
                    <div
                        className="mt-4 p-4 rounded-2xl border bg-white shadow-sm"
                        style={{
                            borderColor: 'rgba(99,102,241,0.2)',
                            background: 'linear-gradient(135deg, rgba(240,246,255,0.9), rgba(255,245,250,0.9))'
                        }}
                    >
                        <div className="flex items-start">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0" style={{ backgroundColor: 'rgba(59,130,246,0.08)' }}>
                                <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 11V8a5 5 0 0110 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-medium text-gray-900">{t('Secure Escrow Payment')}</h4>
                                <p className="text-sm text-gray-600 mt-1">{t('Your payment will be held securely in escrow and released to the creator upon content delivery and your approval.')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <ContinueCTA
                    disabled={false}
                    onClick={() => {
                        // Persist chosen model and budget cap so the summary page can read it
                        try {
                            const budgetCap = selectedModel === 'Lump' ? lumpBudget : (selectedModel === 'CPM' ? cpmBudget : cpcBudget);
                            localStorage.setItem('sponsor_selected_model', selectedModel);
                            localStorage.setItem('sponsor_budget_cap', String(budgetCap));
                            // Persist detailed rate/bonus info so EscrowSummary can display it
                            try { localStorage.setItem('sponsor_cpc_rate', String(cpcRate)); } catch (e) {}
                            try { localStorage.setItem('sponsor_cpm_rate', String(cpmRate)); } catch (e) {}
                            try { localStorage.setItem('sponsor_engagement_bonus', String(bonusPct) + '%'); } catch (e) {}
                            try { localStorage.setItem('sponsor_bonus_enabled', bonusEnabled ? '1' : '0'); } catch (e) {}
                            // The platform may store which requests were selected elsewhere; keep that key name consistent
                        } catch (e) {}
                        setCurrentPage('AudienceSelection');
                    }}
                    ACCENT_COLOR={ACCENT_COLOR}
                    bottomOffset={'calc(40px + env(safe-area-inset-bottom))'}
                />
            </div>
        );
    }

    // Default initial view (before tapping Continue)
    return (
        <div className="w-full pb-36"> {/* add bottom padding so content scrolls above fixed Continue CTA */}
            <div className="flex items-center justify-between mb-3">
                <button onClick={() => setCurrentPage('StartCollaboration')} className="text-gray-600 hover:text-gray-900 p-2 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-sm text-gray-500">{t('Step 3 of 6')}</div>
                <div className="text-sm text-gray-500">{t('50% complete')}</div>
            </div>

            <div className="w-full mb-4">
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full" style={{ width: '50%', background: ACCENT_COLOR }} />
                </div>
            </div>

            <div className="mb-4 flex items-center text-gray-600 space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3zM5 20v-2a4 4 0 014-4h6a4 4 0 014 4v2"/></svg>
                <div className="text-sm font-medium">{t("Don't lose your progress!")}</div>
            </div>

            <div className="text-center mb-6">
                <h1 className="text-2xl font-medium text-gray-900">{t('Ready to sponsor user requests')}</h1>
                <p className="text-sm text-gray-500 mt-2">{t('Tap into proven demand with existing video requests')}</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 shadow-sm">
                <div className="flex items-start">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4" style={{ backgroundColor: HIGHLIGHT_COLOR }}>
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{t('How sponsoring user requests works')}</h3>
                        <p className="text-sm text-gray-600 mt-2 max-w-[56ch]">{t("You'll browse real video requests from users on the platform - the same requests visible in the Requests marketplace. When you sponsor a request:")}</p>
                        <ul className="mt-3 text-sm text-gray-600 space-y-2">
                            <li className="flex items-start"><svg className="w-4 h-4 mr-2 mt-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: ACCENT_COLOR }}><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>{t('Your brand gets featured in content people actually want')}</li>
                            <li className="flex items-start"><svg className="w-4 h-4 mr-2 mt-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: ACCENT_COLOR }}><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>{t('Request is marked "Sponsored" for all creators to see')}</li>
                            <li className="flex items-start"><svg className="w-4 h-4 mr-2 mt-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: ACCENT_COLOR }}><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>{t('Creators apply to fulfill the sponsored request')}</li>
                            <li className="flex items-start"><svg className="w-4 h-4 mr-2 mt-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: ACCENT_COLOR }}><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>{t('You review proposals and select the best creator')}</li>
                            <li className="flex items-start"><svg className="w-4 h-4 mr-2 mt-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: ACCENT_COLOR }}><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>{t('Payment held in escrow until content is delivered')}</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Continue CTA button */}
            <ContinueCTA disabled={false} onClick={() => setShowBudget(true)} ACCENT_COLOR={ACCENT_COLOR} />
        </div>
    );
};

// --- Sponsor Summary / Confirmation Page ---
const SponsorSummary = ({ setCurrentPage, ACCENT_COLOR }) => {
    const t = (key) => getTranslation(key, (typeof window !== 'undefined' ? localStorage.getItem('regaarder_language') : 'English') || 'English');
    // Read persisted values (set when user tapped Continue on the budget screen)
    let selectedModel = 'CPM';
    let budgetCap = 0;
    try {
        selectedModel = localStorage.getItem('sponsor_selected_model') || selectedModel;
        budgetCap = Number(localStorage.getItem('sponsor_budget_cap') || 0);
    } catch (e) {}

    if (!budgetCap) budgetCap = 100;

    // Live selected count (reflects selected requests). Initialize from localStorage if available.
    const [selectedCount, setSelectedCount] = useState(() => {
        try {
            const ids = JSON.parse(localStorage.getItem('sponsor_selected_ids') || 'null');
            if (Array.isArray(ids)) return ids.length;
            const fallback = Number(localStorage.getItem('sponsor_selected_count') || localStorage.getItem('selected_requests_count') || 0);
            return fallback || 0;
        } catch (e) { return Number(localStorage.getItem('sponsor_selected_count') || 0) || 0; }
    });

    // Listen for storage events (other tabs) and for bus events when selections change
    useEffect(() => {
        const onStorage = (ev) => {
            try {
                if (!ev.key) return;
                if (ev.key === 'sponsor_selected_ids' || ev.key === 'sponsor_selected_count' || ev.key === 'selected_requests_count') {
                    const ids = JSON.parse(localStorage.getItem('sponsor_selected_ids') || 'null');
                    if (Array.isArray(ids)) setSelectedCount(ids.length);
                    else setSelectedCount(Number(localStorage.getItem('sponsor_selected_count') || localStorage.getItem('selected_requests_count') || 0) || 0);
                }
            } catch (e) {}
        };
        window.addEventListener('storage', onStorage);

        const onBusSelection = (payload) => {
            try {
                if (!payload) return;
                if (Array.isArray(payload)) setSelectedCount(payload.length);
                else if (typeof payload === 'number') setSelectedCount(payload);
            } catch (e) {}
        };
        try { busOn('requests:selected_ids', onBusSelection); } catch (e) {}

        return () => {
            try { window.removeEventListener('storage', onStorage); } catch (e) {}
            try { busOff('requests:selected_ids', onBusSelection); } catch (e) {}
        };
    }, []);

    // Poll localStorage as a fallback for same-window updates that don't emit storage events
    useEffect(() => {
        let last = null;
        try { last = localStorage.getItem('sponsor_selected_ids') || localStorage.getItem('sponsor_selected_count') || localStorage.getItem('selected_requests_count') || null; } catch (e) {}
        const check = () => {
            try {
                const idsRaw = localStorage.getItem('sponsor_selected_ids');
                if (idsRaw) {
                    const ids = JSON.parse(idsRaw || 'null');
                    if (Array.isArray(ids)) {
                        if (!last || last !== idsRaw) {
                            last = idsRaw;
                            setSelectedCount(ids.length);
                        }
                        return;
                    }
                }
                const cnt = String(Number(localStorage.getItem('sponsor_selected_count') || localStorage.getItem('selected_requests_count') || 0));
                if (cnt !== last) {
                    last = cnt;
                    setSelectedCount(Number(cnt) || 0);
                }
            } catch (e) {}
        };
        const t = setInterval(check, 900);
        return () => clearInterval(t);
    }, []);

    // Local search and category state synchronized with Requests feed via localStorage
    const [searchQuery, setSearchQuery] = useState(() => {
        try { return localStorage.getItem('requests_search_query') || ''; } catch (e) { return ''; }
    });
    const [activeFilter, setActiveFilter] = useState(() => {
        try { return localStorage.getItem('requests_active_filter') || 'Trending'; } catch (e) { return 'Trending'; }
    });
    const [allRequests, setAllRequests] = useState([]);
    const [filters, setFilters] = useState([]);
    const [showSwipeInfo, setShowSwipeInfo] = useState(() => {
        try { return localStorage.getItem('requests_swipe_entrance_shown') ? false : true; } catch (e) { return true; }
    });
    const [openCategories, setOpenCategories] = useState(false);
    const catRef = useRef(null);
    const [portalDropdownStyle, setPortalDropdownStyle] = useState(null);
    const portalRef = useRef(null);

    // Persist locally and emit events so RequestsFeed updates immediately (two-way sync)
    useEffect(() => {
        try { localStorage.setItem('requests_search_query', searchQuery); } catch (e) {}
        try { busEmit('requests:search', searchQuery); } catch (e) {}
    }, [searchQuery]);
    useEffect(() => {
        try { localStorage.setItem('requests_active_filter', activeFilter); } catch (e) {}
        try { busEmit('requests:filter', activeFilter); } catch (e) {}
    }, [activeFilter]);

    // Compute portal dropdown coordinates when opened (so the portal dropdown appears above other elements)
    useEffect(() => {
        if (!openCategories || !catRef.current) {
            setPortalDropdownStyle(null);
            return;
        }
        const el = catRef.current;
        const rect = el.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const scrollX = window.scrollX || window.pageXOffset || 0;
        let left = rect.left + scrollX;
        let top = rect.bottom + scrollY + 6; // small gap
        // Set initial position (width will be measured after portal mounts)
        setPortalDropdownStyle({ top, left });

        const onResize = () => {
            try {
                const r = el.getBoundingClientRect();
                const sY = window.scrollY || window.pageYOffset || 0;
                let l = r.left + (window.scrollX || window.pageXOffset || 0);
                setPortalDropdownStyle(prev => ({ ...(prev || {}), top: r.bottom + sY + 6, left: l }));
            } catch (e) {}
        };

        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', onResize, { passive: true });
        return () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('scroll', onResize);
        };
    }, [openCategories, catRef.current, filters]);

    // After the portal mounts, measure its width and adjust left to avoid overflow
    useEffect(() => {
        if (!openCategories) return;
        // Measure after next paint
        const raf = requestAnimationFrame(() => {
            try {
                const portalEl = portalRef.current;
                if (!portalEl || !portalDropdownStyle) return;
                const rect = portalEl.getBoundingClientRect();
                const width = rect.width;
                let left = portalDropdownStyle.left || 0;
                // If it overflows the right edge, shift it left
                if (left + width > window.innerWidth - 8) {
                    left = Math.max(8, window.innerWidth - width - 8);
                }
                // update style if changed
                setPortalDropdownStyle(prev => {
                    if (!prev) return { top: prev ? prev.top : 0, left };
                    if (Math.abs((prev.left || 0) - left) > 1) return { ...prev, left };
                    return prev;
                });
            } catch (e) {}
        });
        return () => cancelAnimationFrame(raf);
    }, [openCategories, portalDropdownStyle]);

    // Close dropdown on tap/click outside or when pressing Escape
    useEffect(() => {
        if (!openCategories) return;
        const handlePointer = (e) => {
            try {
                const target = e.target;
                if (!target) return;
                if (catRef.current && catRef.current.contains(target)) return;
                if (portalRef.current && portalRef.current.contains(target)) return;
                setOpenCategories(false);
            } catch (err) {}
        };
        const handleKey = (e) => {
            if (e.key === 'Escape') setOpenCategories(false);
        };

        document.addEventListener('pointerdown', handlePointer);
        document.addEventListener('touchstart', handlePointer);
        document.addEventListener('keydown', handleKey);

        return () => {
            document.removeEventListener('pointerdown', handlePointer);
            document.removeEventListener('touchstart', handlePointer);
            document.removeEventListener('keydown', handleKey);
        };
    }, [openCategories]);

    // Subscribe to external changes so SponsorSummary reflects live updates
    useEffect(() => {
        const onSearch = (q) => {
            try { if ((q || '') !== (searchQuery || '')) setSearchQuery(q || ''); } catch (e) {}
        };
        const onFilter = (f) => {
            try { if ((f || '') !== (activeFilter || '')) setActiveFilter(f || 'Trending'); } catch (e) {}
        };
        busOn('requests:search', onSearch);
        busOn('requests:filter', onFilter);
        return () => {
            try { busOff('requests:search', onSearch); } catch (e) {}
            try { busOff('requests:filter', onFilter); } catch (e) {}
        };
    }, [searchQuery, activeFilter]);

    // Dynamically import requests data and filters to avoid load-time coupling
    useEffect(() => {
        let mounted = true;
        import('./requests.jsx')
            .then(mod => {
                if (!mounted) return;
                try {
                    setAllRequests(mod.MOCK_REQUESTS || []);
                    setFilters(mod.REQUEST_FILTERS || []);
                    // If activeFilter was not set (or was default), prefer the first exported filter
                    const stored = (() => { try { return localStorage.getItem('requests_active_filter'); } catch (e) { return null; } })();
                    if (!stored && mod.REQUEST_FILTERS && mod.REQUEST_FILTERS[0]) {
                        setActiveFilter(mod.REQUEST_FILTERS[0].name);
                    }
                } catch (e) { }
            })
            .catch(() => {});
        return () => { mounted = false; };
    }, []);

    // Helper to apply active filter (same logic as requests.jsx)
    const applyActiveFilter = (list) => {
        switch (activeFilter) {
            case 'Trending': return list.filter(r => r.isTrending);
            case 'Newest': return [...list].sort((a, b) => b.id - a.id);
            case 'Top Funded': return [...list].sort((a, b) => b.funding - a.funding);
            case 'Completed': return list.filter(r => r.isCompleted);
            case 'Following': return list; // placeholder
            default: return list;
        }
    };

    const filteredByCategory = applyActiveFilter(allRequests);
    const displayedRequests = filteredByCategory.filter(req => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.trim().toLowerCase();
        return (
            req.title.toLowerCase().includes(q) ||
            req.description.toLowerCase().includes(q) ||
            req.company.toLowerCase().includes(q)
        );
    });

    const firstRequest = displayedRequests && displayedRequests.length ? displayedRequests[0] : null;

    return (
        <div className="w-full pt-4 pb-24">
            <div className="mb-6 flex items-center justify-between">
                <button onClick={() => setCurrentPage('SponsorUserRequests')} className="text-gray-600 hover:text-gray-900 p-2 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-sm text-gray-500">{t('Review')}</div>
                <div style={{ width: 36 }} />
            </div>

            <div className="max-w-md mx-auto space-y-6">
                {/* Note: header and search controls are provided on the main Browse Requests page.
                    This summary view intentionally omits the full header/search to avoid duplication. */}

                {/* Compact header above the swipe card (synced with Requests page) */}
                <div>
                    <div className="text-center mb-3">
                        <h1 className="text-xl sm:text-2xl font-medium text-gray-900">{t('Browse user requests')}</h1>
                        <p className="text-sm text-gray-500 mt-2">{t('Select requests to sponsor that align with your brand')}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:space-x-3 mb-4 space-y-3 sm:space-y-0">
                        <div className="relative flex-1">
                            <input
                                type="search"
                                placeholder={t("Search requests...")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none"
                            />
                        </div>

                        <div className="relative w-full sm:w-auto" ref={catRef}>
                            <button
                                onClick={() => {
                                    const willOpen = !openCategories;
                                    setOpenCategories(willOpen);
                                    try {
                                        if (willOpen && catRef.current) {
                                            const el = catRef.current;
                                            const rect = el.getBoundingClientRect();
                                            const scrollY = window.scrollY || window.pageYOffset || 0;
                                            const scrollX = window.scrollX || window.pageXOffset || 0;
                                            setPortalDropdownStyle({ top: rect.bottom + scrollY + 6, left: rect.left + scrollX });
                                        }
                                    } catch (e) {}
                                }}
                                className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm flex items-center space-x-2"
                                aria-haspopup="listbox"
                                aria-expanded={openCategories}
                            >
                                <span>{activeFilter}</span>
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            </button>

                            {openCategories && (
                                // Render dropdown in a portal to avoid clipping / stacking context issues
                                portalDropdownStyle && createPortal(
                                    <div
                                        ref={portalRef}
                                        style={{
                                            position: 'absolute',
                                            top: (portalDropdownStyle.top || 0) + 'px',
                                            left: (portalDropdownStyle.left || 0) + 'px',
                                            zIndex: 9999
                                        }}
                                        className="bg-white border border-gray-200 rounded-xl shadow-lg"
                                    >
                                        {(
                                            (filters && filters.length) ? filters.map(f => (
                                                <button
                                                    key={f.name}
                                                    onClick={() => { setActiveFilter(f.name); setOpenCategories(false); }}
                                                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${activeFilter === f.name ? 'font-semibold bg-gray-50' : ''}`}
                                                >
                                                    {f.name}
                                                </button>
                                            )) : [
                                                'Trending', 'Newest', 'Top Funded', 'Completed', 'Following'
                                            ].map(name => (
                                                <button
                                                    key={name}
                                                    onClick={() => { setActiveFilter(name); setOpenCategories(false); }}
                                                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${activeFilter === name ? 'font-semibold bg-gray-50' : ''}`}
                                                >
                                                    {name}
                                                </button>
                                            ))
                                        )}
                                    </div>,
                                    document.body
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Swipe to Sponsor info card */}
                {showSwipeInfo && (
                    <div className="p-4 rounded-2xl border-2" style={{ borderColor: ACCENT_COLOR, backgroundColor: HIGHLIGHT_COLOR }}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                            <div className="flex items-start space-x-3">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: ICON_BACKGROUND }}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: ACCENT_COLOR }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 20h.01"></path></svg>
                                </div>
                                <div>
                                    <div className="text-lg font-semibold text-gray-900">{t('Swipe to Sponsor')}</div>
                                    <div className="text-sm text-gray-600 mt-1">{t('Swipe right ??to sponsor automatically, or swipe left ??to skip/remove')}</div>
                                </div>
                            </div>
                            <button
                                className="text-gray-600"
                                onClick={() => {
                                    try { localStorage.setItem('requests_swipe_entrance_shown', '1'); } catch (e) {}
                                    setShowSwipeInfo(false);
                                }}
                                aria-label="Dismiss swipe info"
                            ><X className="w-5 h-5" /></button>
                        </div>
                    </div>
                )}

                {/* Show the first matching request (if any) using same data as Requests page */}
                {firstRequest ? (
                    <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start">
                                <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-100 flex items-center justify-center">
                                    <div className="text-gray-400">{firstRequest.companyInitial || (firstRequest.company ? firstRequest.company.charAt(0) : 'U')}</div>
                                </div>
                                <div>
                                    <div className="font-semibold" style={{ color: ACCENT_COLOR }}>{firstRequest.company}</div>
                                    <div className="text-xs text-gray-400">{firstRequest.timeAgo}</div>
                                </div>
                            </div>
                            {firstRequest.isTrending && <div className="text-sm text-gray-500 px-2 py-1 rounded-full" style={{ backgroundColor: HIGHLIGHT_COLOR, color: ACCENT_COLOR }}>{t('Trending')}</div>}
                        </div>

                        <h3 className="text-xl font-medium text-gray-900 mt-4">{firstRequest.title}</h3>
                        <p className="text-sm text-gray-600 mt-2">{firstRequest.description}</p>

                        <div className="mt-3 flex items-center justify-between">
                            <button className="text-sm" style={{ color: ACCENT_COLOR }}>{t('See more...')}</button>
                            <div className="text-sm text-gray-400">{firstRequest.isSponsored ? t('Sponsored') : ''}</div>
                        </div>

                        <div className="mt-4 border-t pt-3 flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-sm text-gray-500">
                                <div className="flex items-center space-x-2"><Eye className="w-4 h-4" /> <span>{firstRequest.likes || 0}</span></div>
                                <div className="flex items-center space-x-2"><Heart className="w-4 h-4" /> <span>{firstRequest.comments || 0}</span></div>
                                <div className="flex items-center space-x-2"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> <span>{firstRequest.boosts || 0}</span></div>
                            </div>
                    </div>
                ) : (
                    <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm text-center text-gray-500">{t('No requests match your search or selected category.')}</div>
                )}
                <div className="p-4 rounded-2xl border shadow-sm" style={{ borderColor: ACCENT_COLOR, background: 'linear-gradient(to right, var(--color-gold-light), white)' }}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: HIGHLIGHT_COLOR, color: ACCENT_COLOR }}>
                                <Check className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-gray-900">{selectedCount} {selectedCount === 1 ? t('request selected') : t('requests selected')}</div>
                                <div className="text-sm text-gray-500">{t('Ready to sponsor these video requests')}</div>
                            </div>
                        </div>
                        <div className="text-right mt-3 sm:mt-0">
                            <div className="text-2xl font-semibold" style={{ color: ACCENT_COLOR }}>${Number(budgetCap).toLocaleString()}</div>
                            <div className="text-sm text-gray-500">{t('Budget cap')}</div>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl border bg-white shadow-sm">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">{t('Sponsorship summary')}</h4>
                    <p className="text-sm text-gray-600">{t('Payment model')}: <span className="font-medium text-gray-900">{t(selectedModel)}</span></p>
                    <p className="text-sm text-gray-600 mt-2">{t('Budget cap')}: <span className="font-medium text-gray-900">${Number(budgetCap).toLocaleString()}</span></p>
                    <p className="text-sm text-gray-600 mt-2">{t('Selected requests')}: <span className="font-medium text-gray-900">{selectedCount}</span></p>
                </div>

                <div className="pt-2">
                    <button
                        onClick={() => {
                            // Show the escrow / sponsorship confirmation summary
                            setCurrentPage('EscrowSummary');
                        }}
                        className="w-full flex items-center justify-center space-x-2 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition duration-300 hover:opacity-90"
                        style={{ backgroundColor: ACCENT_COLOR }}
                    >
                        <span>{t('Continue')}</span>
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Escrow / Sponsorship Summary Page
const EscrowSummary = ({ setCurrentPage, ACCENT_COLOR }) => {
    const t = (key) => getTranslation(key, (typeof window !== 'undefined' ? localStorage.getItem('regaarder_language') : 'English') || 'English');
    const [selectedCount, setSelectedCount] = useState(0);
    const [selectedModel, setSelectedModel] = useState('CPM');
    const [budgetCap, setBudgetCap] = useState(0);
    const [cpcRate, setCpcRate] = useState(null);
    const [cpmRate, setCpmRate] = useState(null);
    const [engagementBonus, setEngagementBonus] = useState(null);

    const [escrowAmount, setEscrowAmount] = useState(0);
    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [miniAfAmount, setMiniAfAmount] = useState('');
    const [miniProcessing, setMiniProcessing] = useState(false);

    useEffect(() => {
        try {
            const idsRaw = localStorage.getItem('sponsor_selected_ids');
            if (idsRaw) {
                const ids = JSON.parse(idsRaw || 'null');
                if (Array.isArray(ids)) setSelectedCount(ids.length);
            } else {
                const fallback = Number(localStorage.getItem('sponsor_selected_count') || localStorage.getItem('selected_requests_count') || 0);
                setSelectedCount(fallback || 0);
            }
        } catch (e) {}
        try { setSelectedModel(localStorage.getItem('sponsor_selected_model') || 'CPM'); } catch (e) {}
        try { setBudgetCap(Number(localStorage.getItem('sponsor_budget_cap') || 0)); } catch (e) {}
        try { const cpc = localStorage.getItem('sponsor_cpc_rate'); if (cpc) setCpcRate(Number(cpc)); } catch (e) {}
        try { const cpm = localStorage.getItem('sponsor_cpm_rate'); if (cpm) setCpmRate(Number(cpm)); } catch (e) {}
        try { const b = localStorage.getItem('sponsor_engagement_bonus'); if (b) setEngagementBonus(b); } catch (e) {}
    }, []);

    // Compute escrow amount applying engagement bonus and platform fee, persist it
    useEffect(() => {
        try {
            const rawBonus = (typeof engagementBonus === 'string') ? (engagementBonus.replace('%','')) : (engagementBonus || '0');
            const bonusPct = Number(rawBonus) || 0;
            const feePct = getPlatformFeePct(); // platform processing fee (fraction, e.g. 0.02 === 2%)
            const base = Number(budgetCap) || 0;
            const cnt = Number(selectedCount) || 0;
            let amount = Math.ceil(base * cnt * (1 + (bonusPct/100)) * (1 + feePct));
            if (!Number.isFinite(amount) || amount < 0) amount = 0;
            setEscrowAmount(amount);
            try { localStorage.setItem('sponsor_escrow_amount', String(amount)); } catch (e) {}
        } catch (e) {}
    }, [budgetCap, selectedCount, engagementBonus]);

    return (
        <div className="w-full">
            <div className="mb-4">
                <div className="text-sm text-gray-500">Step 6 of 6</div>
            </div>

            <div className="max-w-md mx-auto">
                <div className="mb-6">
                    <div className="w-full h-1 rounded-full bg-gray-200 overflow-hidden">
                        <div style={{ width: '100%', height: 8, background: ACCENT_COLOR, borderRadius: 8 }} />
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-white shadow-sm text-center mb-6">
                    <div className="mx-auto w-16 h-16 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: HIGHLIGHT_COLOR }}>
                        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: ACCENT_COLOR }}><path d="M12 1.75C7.167 1.75 3.25 5.667 3.25 10.5v3.5c0 .966.784 1.75 1.75 1.75h14c.966 0 1.75-.784 1.75-1.75v-3.5C20.75 5.667 16.833 1.75 12 1.75z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">{t('Secure escrow payment')}</h2>
                    <p className="text-sm text-gray-500 mt-2">{t('Your payment is held securely until creators deliver approved content')}</p>
                </div>

                <div className="bg-white border rounded-2xl shadow-sm p-4 mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">{t('Sponsorship Summary')}</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                        <div>{t('Selected requests')}</div>
                        <div className="text-right font-medium text-gray-900">{selectedCount} {selectedCount === 1 ? t('request') : t('requests')}</div>

                        <div>{t('Payment model')}</div>
                        <div className="text-right font-medium text-gray-900">{selectedModel === 'CPC' ? t('Pay Per Click (CPC)') : selectedModel === 'CPM' ? t('Pay Per View (CPM)') : t(selectedModel)}</div>

                        {selectedModel === 'CPC' && cpcRate != null && (
                            <>
                                <div>{t('CPC rate')}</div>
                                <div className="text-right font-medium text-gray-900">{t('${0} per click').replace('{0}', Number(cpcRate).toFixed(2))}</div>
                            </>
                        )}

                        {selectedModel === 'CPM' && cpmRate != null && (
                            <>
                                <div>{t('CPM rate')}</div>
                                <div className="text-right font-medium text-gray-900">{t('${0} per 1,000 views').replace('{0}', Number(cpmRate).toFixed(2))}</div>
                            </>
                        )}

                        <div>{t('Budget cap')}</div>
                        <div className="text-right font-medium text-gray-900">${Number(budgetCap).toLocaleString()}</div>

                        {engagementBonus && (
                            <>
                                <div>{t('Engagement bonus')}</div>
                                <div className="text-right font-medium text-gray-900">{engagementBonus}</div>
                            </>
                        )}
                    </div>

                    <div className="mt-4 border-t pt-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">{t('Amount to escrow')}</div>
                            <div className="text-2xl font-semibold" style={{ color: ACCENT_COLOR }}>${Number(budgetCap * selectedCount).toLocaleString()}</div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{t('Unused funds returned after 30 days')}</p>
                    </div>
                </div>

                <div className="p-4 rounded-2xl border shadow-sm" style={{ background: 'linear-gradient(to right, var(--color-gold-light), white)', borderColor: ACCENT_COLOR }}>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">{t('How escrow works')}</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                        <li> ??{t('Your payment is held securely by Regaarder')}</li>
                        <li> ??{t('Requests are marked "Sponsored" for creators to see')}</li>
                        <li> ??{t('Creators apply with proposals for each request')}</li>
                        <li> ??{t('You review and select the best creator(s)')}</li>
                        <li> ??{t('Creators deliver content featuring your brand')}</li>
                        <li> ??{t('You approve the content before payment is released')}</li>
                    </ul>
                </div>

                <div className="pt-4">
                    <button
                        onClick={() => {
                            try {
                                const amt = Number(escrowAmount) || 0;
                                if (getAccountBalance() >= amt && amt > 0) {
                                    // Deduct and complete
                                    const ok = chargeFromAccount(amt);
                                    if (ok) {
                                        try { localStorage.setItem('sponsor_payment_method', 'balance'); } catch (e) {}
                                        try { localStorage.setItem('sponsor_payment_status', 'paid'); } catch (e) {}
                                        // Persist completed campaign so it shows under Your Campaigns
                                        try {
                                            const name = localStorage.getItem('sponsor_selected_format_title') || 'Campaign';
                                            const idsRaw = localStorage.getItem('matched_selected_creator_ids') || localStorage.getItem('sponsor_selected_ids');
                                            let creators = 0;
                                            if (idsRaw) {
                                                try { const arr = JSON.parse(idsRaw); if (Array.isArray(arr)) creators = arr.length; } catch (e) {}
                                            } else {
                                                creators = Number(localStorage.getItem('sponsor_selected_count') || 0) || 0;
                                            }
                                            addCompletedCampaign({ name, spent: amt, creators, status: 'active' });
                                        } catch (e) {}
                                        setCurrentPage('AdvertiserDashboard');
                                        return;
                                    }
                                }
                            } catch (e) {}
                            setShowBalanceModal(true);
                        }}
                        className="w-full flex items-center justify-center space-x-3 text-white font-semibold py-3 px-4 rounded-md shadow-lg transition duration-300 hover:opacity-90"
                        style={{ backgroundColor: ACCENT_COLOR }}
                        aria-label={`Secure $${Number(escrowAmount).toLocaleString()} in Escrow`}
                    >
                        <span className="inline-flex items-center space-x-2">
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="11" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 11V9a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            <span>{t('Secure ${0} in Escrow').replace('{0}', Number(escrowAmount).toLocaleString())}</span>
                        </span>
                    </button>
                </div>

                {showBalanceModal && (
                    <div className="fixed inset-0 z-40 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setShowBalanceModal(false)} />
                        <div className="relative bg-white w-full max-w-md mx-auto rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">{t('Pay from Account Balance')}</h3>
                            <p className="text-sm text-gray-600 mb-4">{t('You can use your account balance to secure this payment, or add funds if needed.')}</p>
                            <div className="mb-4">
                                <div className="text-sm text-gray-500">{t('Available balance')}</div>
                                <div className="text-2xl font-semibold" style={{ color: ACCENT_COLOR }}>${getAccountBalance().toFixed(2)}</div>
                            </div>
                            <div className="mb-4">
                                <div className="text-sm text-gray-500">{t('Amount required')}</div>
                                <div className="text-xl font-semibold">${Number(escrowAmount).toLocaleString()}</div>
                            </div>
                            <div className="flex items-center justify-end space-x-3">
                                <button onClick={() => setShowBalanceModal(false)} className="px-4 py-2 rounded-md border">{t('Cancel')}</button>
                                {getAccountBalance() >= Number(escrowAmount) ? (
                                    <button onClick={() => {
                                        const ok = chargeFromAccount(Number(escrowAmount));
                                        if (ok) {
                                            try { localStorage.setItem('sponsor_payment_method', 'balance'); } catch (e) {}
                                            try { localStorage.setItem('sponsor_payment_status', 'paid'); } catch (e) {}
                                            setShowBalanceModal(false);
                                            setCurrentPage('AdvertiserDashboard');
                                        } else {
                                            alert('Unable to deduct from balance.');
                                        }
                                    }} className="px-4 py-2 rounded-md text-white font-semibold" style={{ backgroundColor: ACCENT_COLOR }}>{t('Pay from Balance')}</button>
                                ) : (
                                    <div className="w-full">
                                        <div className="text-sm text-gray-600 mb-2">{t('Insufficient balance. Quick Add Funds to proceed.')}</div>
                                        <div className="flex space-x-2 mb-2">
                                            <input type="number" min="1" value={miniAfAmount} onChange={(e) => setMiniAfAmount(e.target.value)} placeholder={t("Amount")} className="w-1/2 px-3 py-2 border rounded-md" />
                                            <button onClick={async () => {
                                                try {
                                                    const amt = Math.max(0, Number(miniAfAmount) || 0);
                                                    if (!amt) return alert(t('Enter amount'));
                                                    setMiniProcessing(true);
                                                    await stubStripeTokenize({ amount: amt });
                                                    const newBal = getAccountBalance() + amt;
                                                    try { localStorage.setItem('account_balance', String(newBal)); } catch (e) {}
                                                    setMiniAfAmount('');
                                                    setMiniProcessing(false);
                                                    alert(t('Funds added. You can now pay from balance.'));
                                                } catch (e) { setMiniProcessing(false); }
                                            }} className="px-3 py-2 rounded-md text-white" style={{ backgroundColor: ACCENT_COLOR }}>{miniProcessing ? t('Processing...') : t('Add Funds')}</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Payment Methods / Secure Collaboration (Step 8 for content-integration flow)
const PaymentMethods = ({ setCurrentPage, ACCENT_COLOR }) => {
    const t = (key) => getTranslation(key, (typeof window !== 'undefined' ? localStorage.getItem('regaarder_language') : 'English') || 'English');
    const [method, setMethod] = useState('card');
    const [selectedCount, setSelectedCount] = useState(0);
    const [budgetCap, setBudgetCap] = useState(0);
    const [estReach, setEstReach] = useState('');
    const [totalCost, setTotalCost] = useState(0);
    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [miniAfAmount, setMiniAfAmount] = useState('');
    const [miniAfMethod, setMiniAfMethod] = useState('card');
    const [miniProcessing, setMiniProcessing] = useState(false);

    useEffect(() => {
        try {
            const idsRaw = localStorage.getItem('matched_selected_creator_ids') || localStorage.getItem('sponsor_selected_ids');
            if (idsRaw) {
                const ids = JSON.parse(idsRaw || 'null');
                if (Array.isArray(ids)) setSelectedCount(ids.length);
            }
        } catch (e) {}
        try { setBudgetCap(Number(localStorage.getItem('sponsor_budget_cap') || 0)); } catch (e) {}
        try {
            // Compute estimated reach and total cost using available business inputs
            const selectedModel = (localStorage.getItem('sponsor_selected_model') || 'CPM');
            const cpmRate = Number(localStorage.getItem('sponsor_cpm_rate') || 0);
            const cpcRate = Number(localStorage.getItem('sponsor_cpc_rate') || 0);
            const rawBonus = (localStorage.getItem('sponsor_engagement_bonus') || '').toString().replace('%','') || '0';
            const bonusPct = Number(rawBonus) || 0;
            const feePct = getPlatformFeePct();
            const b = Number(localStorage.getItem('sponsor_budget_cap') || 0);
            const cnt = Number((() => {
                try { const r = localStorage.getItem('matched_selected_creator_ids') || localStorage.getItem('sponsor_selected_ids'); if (r) { const arr = JSON.parse(r); if (Array.isArray(arr)) return arr.length; } } catch (e) {}
                return 0;
            })());

            // Determine views per dollar using available rate info
            let viewsPerDollar = 100; // default fallback
            if (selectedModel === 'CPM' && cpmRate > 0) {
                // cpmRate is $ per 1,000 views
                viewsPerDollar = 1000 / cpmRate;
            } else if (selectedModel === 'CPC' && cpcRate > 0) {
                // approximate views per click * clicks per dollar
                // assume average 30 views per click; clicks per dollar = 1 / cpcRate
                viewsPerDollar = (30 / cpcRate);
            } else if (b > 0) {
                // fallback: infer from historical multiplier (use 100 views per $ as conservative)
                viewsPerDollar = 100;
            }

            const estimatedReachRaw = Math.round(b * cnt * viewsPerDollar);
            setEstReach(estimatedReachRaw ? `${formatCompact(estimatedReachRaw)} views` : 'N/A');

            // Compute total cost with engagement bonus and platform fee
            const escrowEstimate = Math.ceil(b * cnt * (1 + (bonusPct/100)) * (1 + feePct));
            setTotalCost(escrowEstimate || 0);
            try { localStorage.setItem('sponsor_estimated_reach', estimatedReachRaw ? String(estimatedReachRaw) : ''); } catch (e) {}
            try { localStorage.setItem('sponsor_escrow_amount', String(escrowEstimate || 0)); } catch (e) {}
        } catch (e) {}
    }, []);

    const handleSecure = () => {
        try {
            if (method === 'balance') {
                setShowBalanceModal(true);
                return;
            }
            localStorage.setItem('sponsor_payment_method', method);
        } catch (e) {}
        // Register a completed campaign when payment is secured
        try {
            const amt = Number(localStorage.getItem('sponsor_escrow_amount') || totalCost || 0) || 0;
            const name = localStorage.getItem('sponsor_selected_format_title') || 'Campaign';
            const idsRaw = localStorage.getItem('matched_selected_creator_ids') || localStorage.getItem('sponsor_selected_ids');
            let creators = 0;
            if (idsRaw) {
                try { const arr = JSON.parse(idsRaw); if (Array.isArray(arr)) creators = arr.length; } catch (e) {}
            } else {
                creators = Number(localStorage.getItem('sponsor_selected_count') || 0) || 0;
            }
            addCompletedCampaign({ name, spent: amt, creators, status: 'active' });
        } catch (e) {}
        setCurrentPage('AdvertiserDashboard');
    };

    return (
        <div className="w-full">
            <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                    <div />
                    <div className="text-sm text-gray-500">{t('Step 8 of 8')}</div>
                    <div className="text-sm text-gray-500">{t('100% complete')}</div>
                </div>

                {/* Progress bar */}
                <div className="w-full mb-3">
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="h-2 rounded-full" style={{ width: `100%`, background: ACCENT_COLOR }} />
                    </div>
                </div>

                <div className="text-center mb-4">
                    <div className="mx-auto w-16 h-16 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: HIGHLIGHT_COLOR }}>
                        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: ACCENT_COLOR }}><rect x="3" y="7" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M8 7V5a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">{t('Secure your collaboration')}</h2>
                    <p className="text-sm text-gray-500 mt-2">{t('Choose your payment method to activate your campaign')}</p>
                </div>
            </div>

            <div className="max-w-md mx-auto">
                <div className="mb-6 p-4 rounded-xl bg-white shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">{t('Campaign Summary')}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>{t('Total Creators')}:</div>
                        <div className="text-right font-medium text-gray-900">{selectedCount}</div>
                        <div>{t('Estimated Reach')}:</div>
                        <div className="text-right font-medium text-gray-900">{estReach}</div>
                        <div>{t('Campaign Budget')}:</div>
                        <div className="text-right font-medium text-gray-900">${Number(budgetCap).toLocaleString()}</div>
                    </div>
                </div>

                <div className="mb-6 p-4 rounded-xl bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-gray-700">{t('Total Cost')}:</div>
                        <div className="text-2xl font-semibold" style={{ color: ACCENT_COLOR }}>${Number(totalCost).toLocaleString()}</div>
                    </div>

                    <h4 className="text-sm font-medium text-gray-700 mb-3">{t('Select Payment Method')}</h4>
                    <div className="space-y-3">
                        <label className={`flex items-center p-4 rounded-xl border`} style={method === 'card' ? { backgroundColor: HIGHLIGHT_COLOR, boxShadow: '0 0 0 2px rgba(var(--color-gold-rgb),0.08)' } : undefined}>
                            <input type="radio" name="pm" checked={method === 'card'} onChange={() => setMethod('card')} className="mr-3" />
                            <div>
                                <div className="font-medium text-gray-900">{t('Credit / Debit Card')}</div>
                                <div className="text-sm text-gray-500">{t('Visa, Mastercard, Amex')}</div>
                            </div>
                        </label>

                        <label className={`flex items-center p-4 rounded-xl border`} style={method === 'paypal' ? { backgroundColor: HIGHLIGHT_COLOR, boxShadow: '0 0 0 2px rgba(var(--color-gold-rgb),0.08)' } : undefined}>
                            <input type="radio" name="pm" checked={method === 'paypal'} onChange={() => setMethod('paypal')} className="mr-3" />
                            <div>
                                <div className="font-medium text-gray-900">PayPal</div>
                                <div className="text-sm text-gray-500">{t('Pay with your PayPal account')}</div>
                            </div>
                        </label>

                        <label className={`flex items-center p-4 rounded-xl border`} style={method === 'bank' ? { backgroundColor: HIGHLIGHT_COLOR, boxShadow: '0 0 0 2px rgba(var(--color-gold-rgb),0.08)' } : undefined}>
                            <input type="radio" name="pm" checked={method === 'bank'} onChange={() => setMethod('bank')} className="mr-3" />
                            <div>
                                <div className="font-medium text-gray-900">{t('Bank Transfer')}</div>
                                <div className="text-sm text-gray-500">{t('Direct bank transfer (ACH)')}</div>
                            </div>
                        </label>

                        <label className={`flex items-center p-4 rounded-xl border`} style={method === 'balance' ? { backgroundColor: HIGHLIGHT_COLOR, boxShadow: '0 0 0 2px rgba(var(--color-gold-rgb),0.08)' } : undefined}>
                            <input type="radio" name="pm" checked={method === 'balance'} onChange={() => setMethod('balance')} className="mr-3" />
                            <div>
                                <div className="font-medium text-gray-900">{t('Account Balance')}</div>
                                <div className="text-sm text-gray-500">{t('Available')}: ${(() => { try { return Number(localStorage.getItem('account_balance')||0).toFixed(2); } catch (e) { return '0.00'; } })()}</div>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="pt-4">
                    <button onClick={handleSecure} className="w-full flex items-center justify-center space-x-3 text-white font-semibold py-3 px-4 rounded-md shadow-lg" style={{ backgroundColor: ACCENT_COLOR }}>
                        <span>{t('Secure Payment')}</span>
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                </div>
                {showBalanceModal && (
                    <div className="fixed inset-0 z-40 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setShowBalanceModal(false)} />
                        <div className="relative bg-white w-full max-w-md mx-auto rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">{t('Pay from Account Balance')}</h3>
                            <p className="text-sm text-gray-600 mb-4">{t('Use your available account balance to fund this payment.')}</p>
                            <div className="mb-4">
                                <div className="text-sm text-gray-500">{t('Available balance')}</div>
                                <div className="text-2xl font-semibold" style={{ color: ACCENT_COLOR }}>${getAccountBalance().toFixed(2)}</div>
                            </div>
                            <div className="mb-4">
                                <div className="text-sm text-gray-500">{t('Amount required')}</div>
                                <div className="text-xl font-semibold">${Number(totalCost).toLocaleString()}</div>
                            </div>
                            <div className="flex items-center justify-end space-x-3">
                                <button onClick={() => setShowBalanceModal(false)} className="px-4 py-2 rounded-md border">{t('Cancel')}</button>
                                {getAccountBalance() >= Number(totalCost) ? (
                                    <button onClick={() => {
                                        const ok = chargeFromAccount(Number(totalCost));
                                        if (ok) {
                                            try { localStorage.setItem('sponsor_payment_method', 'balance'); } catch (e) {}
                                            try { localStorage.setItem('sponsor_payment_status', 'paid'); } catch (e) {}
                                            try {
                                                const name = localStorage.getItem('sponsor_selected_format_title') || 'Campaign';
                                                const idsRaw = localStorage.getItem('matched_selected_creator_ids') || localStorage.getItem('sponsor_selected_ids');
                                                let creators = 0;
                                                if (idsRaw) {
                                                    try { const arr = JSON.parse(idsRaw); if (Array.isArray(arr)) creators = arr.length; } catch (e) {}
                                                } else {
                                                    creators = Number(localStorage.getItem('sponsor_selected_count') || 0) || 0;
                                                }
                                                addCompletedCampaign({ name, spent: Number(totalCost) || 0, creators, status: 'active' });
                                            } catch (e) {}
                                            setShowBalanceModal(false);
                                            setCurrentPage('AdvertiserDashboard');
                                        } else {
                                            alert('Unable to deduct from balance.');
                                        }
                                    }} className="px-4 py-2 rounded-md text-white font-semibold" style={{ backgroundColor: ACCENT_COLOR }}>{t('Pay from Balance')}</button>
                                ) : (
                                    <div className="space-y-2 w-full">
                                        <div className="text-sm text-gray-600">{t('Insufficient balance. Add funds below or choose another payment method.')}</div>
                                        <div className="mt-3">
                                            <div className="text-sm text-gray-700 mb-2">{t('Quick Add Funds (simulate)')}</div>
                                            <div className="flex space-x-2 mb-2">
                                                <input type="number" min="1" value={miniAfAmount} onChange={(e) => setMiniAfAmount(e.target.value)} placeholder={t("Amount")} className="w-1/2 px-3 py-2 border rounded-md" />
                                                <select value={miniAfMethod} onChange={(e) => setMiniAfMethod(e.target.value)} className="w-1/2 px-3 py-2 border rounded-md">
                                                    <option value="card">Card</option>
                                                    <option value="wise">Wise</option>
                                                    <option value="payoneer">Payoneer</option>
                                                    <option value="bank">Bank</option>
                                                    <option value="western_union">Western Union</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center justify-end space-x-2">
                                                <button onClick={async () => {
                                                    try {
                                                        const amt = Math.max(0, Number(miniAfAmount) || 0);
                                                        if (!amt) return alert(t('Enter amount'));
                                                        setMiniProcessing(true);
                                                        if (miniAfMethod === 'card') {
                                                            await stubStripeTokenize({ amount: amt });
                                                        }
                                                        // For other methods we just simulate
                                                        const newBal = getAccountBalance() + amt;
                                                        try { localStorage.setItem('account_balance', String(newBal)); } catch (e) {}
                                                        setMiniAfAmount('');
                                                        setMiniProcessing(false);
                                                        // After adding, allow immediate pay
                                                        if (getAccountBalance() >= Number(totalCost)) {
                                                            alert(t('Funds added. You can now pay from balance.'));
                                                        } else {
                                                            alert(t('Funds added. Balance updated.'));
                                                        }
                                                    } catch (e) { setMiniProcessing(false); }
                                                }} disabled={miniProcessing} className="px-3 py-2 rounded-md text-white" style={{ backgroundColor: ACCENT_COLOR }}>{miniProcessing ? t('Processing...') : t('Add Funds')}</button>
                                                <button onClick={() => { setShowBalanceModal(false); setMethod('card'); }} className="px-3 py-2 rounded-md border">{t('Use Card Instead')}</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Audience selection page (matches the "Find your audience" screenshots)
const AudienceSelection = ({ setCurrentPage, ACCENT_COLOR, ICON_BACKGROUND }) => {
    const t = (key) => getTranslation(key, (typeof window !== 'undefined' ? localStorage.getItem('regaarder_language') : 'English') || 'English');
    const nicheOptions = [
        'Tech & Innovation', 'Lifestyle', 'Gaming', 'Education',
        'Fitness & Wellness', 'Travel', 'Food & Cooking', 'Music & Arts',
        'Fashion & Beauty', 'Business', 'Automotive', 'Comedy & Humor'
    ];

    const toneOptions = [
        'Formal & Professional', 'Witty & Playful', 'Experimental & Bold', 'Minimalist & Clean', 'Premium & Luxe'
    ];

    // Icon mapping for niches and tones (uses lucide-react imports at top)
    const nicheIconMap = {
        'Tech & Innovation': Rocket,
        'Lifestyle': Heart,
        'Gaming': Crown,
        'Education': FileText,
        'Fitness & Wellness': Zap,
        'Travel': LineChart,
        'Food & Cooking': Gift,
        'Music & Arts': Pencil,
        'Fashion & Beauty': Crown,
        'Business': Briefcase,
        'Automotive': Shield,
        'Comedy & Humor': Sparkles
    };

    const toneIconMap = {
        'Formal & Professional': Briefcase,
        'Witty & Playful': Sparkles,
        'Experimental & Bold': Lightbulb,
        'Minimalist & Clean': Layers,
        'Premium & Luxe': Crown
    };

    const [selectedNiches, setSelectedNiches] = useState([]);
    const [selectedTone, setSelectedTone] = useState('');
    const [toneDropdownOpen, setToneDropdownOpen] = useState(false);

    const toggleNiche = (opt) => {
        setSelectedNiches(prev => prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt]);
    };
    const chooseTone = (t) => setSelectedTone(t === selectedTone ? '' : t);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleOutside = (e) => {
            const toneDropdownElement = document.querySelector('[aria-label="Tone"]');
            if (toneDropdownElement && !toneDropdownElement.closest('.relative')?.contains(e.target)) {
                setToneDropdownOpen(false);
            }
        };

        const handleKey = (e) => {
            if (e.key === "Escape" && toneDropdownOpen) setToneDropdownOpen(false);
        };

        if (toneDropdownOpen) {
            document.addEventListener("mousedown", handleOutside);
            document.addEventListener("touchstart", handleOutside, { passive: true });
            document.addEventListener("keydown", handleKey);
        }

        return () => {
            document.removeEventListener("mousedown", handleOutside);
            document.removeEventListener("touchstart", handleOutside);
            document.removeEventListener("keydown", handleKey);
        };
    }, [toneDropdownOpen]);

    // Progress: compute from step number and default total steps
    const AUDIENCE_STEP = 5;
    const progressPct = computeProgressPct(AUDIENCE_STEP, DEFAULT_TOTAL_STEPS);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-3">
                <button onClick={() => setCurrentPage('SponsorUserRequests')} className="text-gray-600 hover:text-gray-900 p-2 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-sm text-gray-500">{t('Step 5 of 6')}</div>
                <div className="text-sm text-gray-500">{progressPct}% {t('complete')}</div>
            </div>

            {/* Visual progress bar */}
            <div className="w-full mb-4">
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full" style={{ width: `${progressPct}%`, background: ACCENT_COLOR }} />
                </div>
            </div>

            <div className="text-center mb-6">
                <h1 className="text-2xl font-medium text-gray-900">{t('Find your audience')}</h1>
                <p className="text-sm text-gray-500 mt-2">{t('Select niches and tones that match your brand')}</p>
            </div>

            <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('Creator Niches')}</h3>
                <div className="space-y-2">
                    {nicheOptions.map(opt => (
                        <label key={opt} className="flex items-center p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                            <input
                                type="checkbox"
                                checked={selectedNiches.includes(opt)}
                                onChange={() => toggleNiche(opt)}
                                className="w-5 h-5 rounded-lg"
                                style={{ accentColor: 'var(--color-gold)' }}
                            />
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-4" style={{ backgroundColor: 'var(--color-gold-light-bg)' }}>
                                {React.createElement(nicheIconMap[opt] || Sparkles, { className: "w-5 h-5", style: { color: 'var(--color-gold)' } })}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{t(opt)}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
                <div className="space-y-2 text-left flex items-center mb-3">
                    <h3 className="text-gray-800 font-semibold text-base block tracking-tight">
                        {t('Preferred Tone')}
                    </h3>
                </div>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setToneDropdownOpen(prev => !prev)}
                        aria-haspopup="listbox"
                        aria-expanded={toneDropdownOpen}
                        className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
                    >
                        <div className="flex items-center">
                            {selectedTone ? (
                                <span className="text-sm text-gray-800 font-medium">{t(selectedTone)}</span>
                            ) : (
                                <span className="text-sm text-gray-500">{t('Select a tone')}</span>
                            )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition ${toneDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {toneDropdownOpen && (
                        <div className="absolute z-30 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg">
                            <ul role="listbox" aria-label="Tone" className="divide-y divide-gray-100 max-h-72 overflow-auto">
                                {toneOptions.map((tOption) => (
                                    <li
                                        key={tOption}
                                        role="option"
                                        aria-selected={selectedTone === tOption}
                                        onClick={() => {
                                            chooseTone(tOption);
                                            setToneDropdownOpen(false);
                                        }}
                                        className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer`}
                                    >
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-800">{t(tOption)}</div>
                                        </div>
                                        {selectedTone === tOption && <Check className="w-4 h-4 text-[var(--color-gold)]" />}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <div className="text-sm text-gray-500 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: ACCENT_COLOR }}><path d="M3 12l4 4L21 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div>{t('Our AI is analyzing {0} potential creators who match your criteria...').replace('{0}', Math.max(1, Math.min(5, (selectedNiches.length || 2))))}</div>
            </div>

            <div className="pt-6">
                <button
                    className="w-full flex items-center justify-center space-x-2 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition duration-300 hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: ACCENT_COLOR }}
                    onClick={() => {
                                try { localStorage.setItem('sponsor_selected_niches', JSON.stringify(selectedNiches)); } catch (e) {}
                                try { localStorage.setItem('sponsor_selected_tone', selectedTone || ''); } catch (e) {}
                                setCurrentPage('ShareVision');
                            }}
                    disabled={selectedNiches.length === 0 || !selectedTone}
                >
                    <span>{t('Continue')}</span>
                    <ChevronRight className="w-4 h-4 ml-2" />
                </button>
            </div>
        </div>
    );
};

// Meet your matched creators (for content integration flows)
const MeetCreators = ({ setCurrentPage, ACCENT_COLOR }) => {
    const t = (key) => getTranslation(key, (typeof window !== 'undefined' ? localStorage.getItem('regaarder_language') : 'English') || 'English');
    const [matches, setMatches] = useState([
        { id: 'm1', name: 'Sarah Chen', handle: '@sarahtech', niche: 'Tech & Innovation', reach: '425K', est: 1250 },
        { id: 'm2', name: 'Nina Patel', handle: '@ninafood', niche: 'Food & Cooking', reach: '390K', est: 900 },
        { id: 'm3', name: 'Liam Keane', handle: '@liamfit', niche: 'Fitness & Wellness', reach: '210K', est: 700 }
    ]);

    // Read campaign summary from localStorage where available
    const [style, setStyle] = useState('Native Mention');
    const [type, setType] = useState('');
    const [budget, setBudget] = useState(0);

    // Search/filter state for creators list
    const [searchQuery, setSearchQuery] = useState('');

    // Selected creators persisted
    const [selectedCreatorIds, setSelectedCreatorIds] = useState(() => {
        try {
            const raw = localStorage.getItem('matched_selected_creator_ids') || localStorage.getItem('meet_selected_creator_ids');
            if (!raw) return [];
            const arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : [];
        } catch (e) { return []; }
    });

    useEffect(() => {
        try {
            const title = localStorage.getItem('sponsor_selected_format_title');
            if (title) setStyle(title);
            const m = localStorage.getItem('sponsor_selected_model');
            if (m) setType(m === 'CPM' ? 'Pay Per View (CPM)' : (m === 'CPC' ? 'Pay Per Click (CPC)' : m));
            setBudget(Number(localStorage.getItem('sponsor_budget_cap') || 0));
        } catch (e) {}
    }, []);

    // Try to load creators from an external `creatorprofile.jsx` module if present.
    useEffect(() => {
        let mounted = true;
        try {
            let _unsubscribe = null;
            import('./creatorprofile.jsx')
                .then(mod => {
                    if (!mounted) return;
                    // Accept various export shapes: named `CREATORS`, `MOCK_CREATORS`, `creators`, or default export
                    const exported = mod.CREATORS || mod.MOCK_CREATORS || mod.creators || mod.default || [];
                    if (Array.isArray(exported) && exported.length) {
                        const normalized = exported.map((c, idx) => {
                            if (!c) return null;
                            if (typeof c === 'string') return { id: `ext-${idx}`, name: c, handle: '', niche: '', reach: '', est: 0 };
                            return { id: c.id || c.handle || `ext-${idx}`, name: c.name || c.handle || 'Creator', handle: c.handle || '', niche: c.niche || '', reach: c.reach || '', est: c.est || 0 };
                        }).filter(Boolean);
                        if (normalized.length) setMatches(normalized);
                    }

                    // If the creator profile module supports live exports, subscribe to updates
                    try {
                        if (typeof mod.subscribeProfileExports === 'function') {
                            _unsubscribe = mod.subscribeProfileExports((dyn) => {
                                if (!mounted || !dyn) return;
                                const incoming = {
                                    id: dyn.id || dyn.handle || 'me',
                                    name: dyn.name || 'Creator',
                                    handle: dyn.handle || '',
                                    niche: dyn.niche || '',
                                    reach: dyn.reach || '',
                                    est: dyn.est || 0,
                                    image: dyn.image || ''
                                };
                                setMatches(prev => {
                                    // Try to find existing by stable id first, then by handle (case-insensitive)
                                    const byId = prev.findIndex(x => x.id && incoming.id && x.id === incoming.id);
                                    const byHandle = prev.findIndex(x => x.handle && incoming.handle && x.handle.toLowerCase() === incoming.handle.toLowerCase());
                                    const idx = byId !== -1 ? byId : (byHandle !== -1 ? byHandle : -1);
                                    let next = [...prev];
                                    if (idx !== -1) {
                                        // replace existing entry with updated data
                                        next[idx] = { ...next[idx], ...incoming };
                                    } else {
                                        // insert incoming profile at front
                                        next = [incoming, ...next];
                                    }
                                    // Dedupe by id/handle so rapid handle changes don't create multiple entries
                                    const seen = new Set();
                                    next = next.filter(item => {
                                        const key = (item.id || '') + '|' + (item.handle || '').toLowerCase();
                                        if (seen.has(key)) return false;
                                        seen.add(key);
                                        return true;
                                    });
                                    return next;
                                });

                                // If the incoming profile indicates selection state, update selectedCreatorIds.
                                try {
                                    const hasSelectionFlag = ('selected' in dyn) || ('isSelected' in dyn) || ('autoSelect' in dyn);
                                    if (hasSelectionFlag) {
                                        const shouldSelect = Boolean(dyn.selected || dyn.isSelected || dyn.autoSelect);
                                        setSelectedCreatorIds(prevIds => {
                                            if (shouldSelect) {
                                                if (prevIds.includes(incoming.id)) return prevIds;
                                                return [...prevIds, incoming.id];
                                            } else {
                                                return prevIds.filter(id => id !== incoming.id);
                                            }
                                        });
                                    }
                                } catch (e) {
                                    // ignore selection update errors
                                }
                            });
                        }
                    } catch (e) {
                        // ignore subscription errors
                    }
                })
                .catch(() => {});
            return () => { mounted = false; if (typeof _unsubscribe === 'function') try { _unsubscribe(); } catch (e) {} };
        } catch (e) {
            return () => { mounted = false; };
        }
    }, []);

    const displayedMatches = matches.filter(m => {
        try {
            const q = (searchQuery || '').trim().toLowerCase();
            if (!q) return true;
            return (
                (m.name || '').toLowerCase().includes(q) ||
                (m.handle || '').toLowerCase().includes(q) ||
                (m.niche || '').toLowerCase().includes(q)
            );
        } catch (e) { return true; }
    });

    // Persist selected creators and emit event so other parts of the flow can react
    useEffect(() => {
        try {
            localStorage.setItem('matched_selected_creator_ids', JSON.stringify(selectedCreatorIds));
            // also keep legacy key
            localStorage.setItem('meet_selected_creator_ids', JSON.stringify(selectedCreatorIds));
        } catch (e) {}
        try { busEmit('matched:selected_ids', selectedCreatorIds); } catch (e) {}
    }, [selectedCreatorIds]);

    return (
        <div className="w-full">
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <button onClick={() => setCurrentPage('SponsorSummary')} className="text-gray-600 hover:text-gray-900 p-2 rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="text-sm text-gray-500">{t('Step 7 of 8')}</div>
                        <div style={{ width: 36 }} />
                    </div>

                    {/* Progress bar for step 7 */}
                    <div className="w-full mb-3">
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div className="h-2 rounded-full" style={{ width: `${computeProgressPct(7, 8)}%`, background: ACCENT_COLOR }} />
                        </div>
                    </div>

                    <div className="text-center mb-4">
                        <div className="mx-auto w-16 h-16 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: HIGHLIGHT_COLOR }}>
                            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: ACCENT_COLOR }}><path d="M12 2l2.5 5L20 9l-4 3 1 6-5-3-5 3 1-6L4 9l5.5-2L12 2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-900">{t('Meet your matched creators')}</h2>
                        <p className="text-sm text-gray-500 mt-2">{t('Our AI found {0} perfect matches for your brand').replace('{0}', matches.length)}</p>
                    </div>

                    {/* Search bar for creators */}
                    <div className="relative mb-4">
                        <input
                            type="search"
                            placeholder={t("Search creators by name, handle, or niche...")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none"
                        />
                    </div>
                </div>

                <div className="max-w-md mx-auto">

                <div className="mb-4 p-4 rounded-xl bg-white shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">{t('Campaign Summary')}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>{t('Style')}:</div>
                        <div className="text-right font-medium text-gray-900">{t(style)}</div>
                        <div>{t('Type')}:</div>
                        <div className="text-right font-medium text-gray-900">{type ? t(type) : (localStorage.getItem ? t(localStorage.getItem('sponsor_selected_model') ?? 'N/A') : 'N/A')}</div>
                        <div>{t('Budget')}:</div>
                        <div className="text-right font-medium text-gray-900">${Number(budget).toLocaleString()}</div>
                        <div>{t('Est. Reach')}:</div>
                        <div className="text-right font-medium text-gray-900">{budget ? t('{0} views').replace('{0}', Math.round(budget * 80)) : 'N/A'}</div>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-medium text-gray-900">{t('AI Matched Creators')}</h4>
                        <div className="text-sm text-gray-500">{t('{0} selected').replace('{0}', selectedCreatorIds.length)}</div>
                    </div>

                    <div className="space-y-4">
                        {displayedMatches.map(m => {
                            const isSelected = selectedCreatorIds.includes(m.id);
                            return (
                                <div key={m.id} className={`p-4 rounded-xl bg-white shadow-sm flex items-center justify-between`} style={isSelected ? { backgroundColor: HIGHLIGHT_COLOR, boxShadow: '0 0 0 2px rgba(var(--color-gold-rgb),0.08)' } : undefined}>
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 mr-4 flex items-center justify-center">{m.name.split(' ')[0].charAt(0)}</div>
                                        <div>
                                            <div className="font-medium text-gray-900">{m.name} <span className="ml-2 text-xs px-2 py-1 rounded-full" style={{ backgroundColor: HIGHLIGHT_COLOR, color: ACCENT_COLOR }}>{t('60% match')}</span></div>
                                            <div className="text-sm text-gray-500">{m.handle} · {t(m.niche)}</div>
                                            <div className="text-sm text-gray-400 mt-1">{t('{0} avg').replace('{0}', m.reach)} · ${m.est} {t('est.')}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <button
                                            onClick={() => {
                                                setSelectedCreatorIds(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]);
                                            }}
                                            className={`px-3 py-1 rounded-md text-sm font-medium`}
                                            style={isSelected ? { backgroundColor: ACCENT_COLOR, color: 'white' } : { border: '1px solid rgba(0,0,0,0.06)', backgroundColor: 'white', color: '#374151' }}
                                        >
                                            {isSelected ? t('Selected') : t('Select')}
                                        </button>
                                        <div className="text-xs text-gray-400 mt-2">3 {t('videos')}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-4">
                    <button onClick={() => setCurrentPage('PaymentMethods')} className="w-full flex items-center justify-center space-x-2 text-white font-semibold py-3 px-4 rounded-md shadow-lg" style={{ backgroundColor: ACCENT_COLOR }}>
                        <span>{t('Continue to Payment')}</span>
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                </div>
            </div>
        </div>
    );
};



// --- MAIN APPLICATION COMPONENT (ROUTER) ---

const App = () => {
    // State to manage the current view/page. Defaults to 'Home'.
    const [currentPage, setCurrentPage] = useState('Home'); 
    const auth = useAuth();
    const [activeTab, setActiveTab] = useState('Home'); 
    const [showSticky, setShowSticky] = useState(false);

    // Lifted state: uploaded logo preview and campaigns (shared across pages)
    const [uploadedFile, setUploadedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    const [campaigns, setCampaigns] = useState(() => {
        try {
            const raw = localStorage.getItem('advertiser_campaigns');
            if (raw) return JSON.parse(raw) || [];
        } catch (e) {}
        return [
            { id: 'c1', name: 'Summer Launch 2024', status: 'active', spent: 1200, creators: 3 },
            { id: 'c2', name: 'Spring Promo', status: 'completed', spent: 5000, creators: 7 },
        ];
    });
    const [selectedCampaignId, setSelectedCampaignId] = useState(null);
    const [selectedCampaignMode, setSelectedCampaignMode] = useState('view'); // 'view' | 'edit'

    // Load previewUrl from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem('brand_preview_url');
            if (stored) setPreviewUrl(stored);
        } catch (e) {}
    }, []);

    // Require login when opening the Advertise flow; after login redirect to dashboard if sponsor exists
    useEffect(() => {
        const checkSponsor = async () => {
            try {
                if (!auth) return;
                if (!auth.user) {
                    // Prompt login for guests when they land on the advertise app
                    auth.openAuthModal();
                    setCurrentPage('Welcome');
                    return;
                }

                const token = localStorage.getItem('regaarder_token');
                const res = await fetch(`${(window && window.__BACKEND_URL__) || 'https://pwin.onrender.com'}/sponsors/me`, {
                    headers: { 'Authorization': token ? `Bearer ${token}` : '' }
                });
                if (!res.ok) {
                    setCurrentPage('Welcome');
                    return;
                }
                const data = await res.json();
                if (data && Array.isArray(data.sponsors) && data.sponsors.length > 0) {
                    setCurrentPage('AdvertiserDashboard');
                } else {
                    setCurrentPage('Welcome');
                }
            } catch (e) {
                console.error('checkSponsor error', e);
            }
        };
        checkSponsor();
    }, [auth && auth.user]);

    // Sync campaigns with localStorage updates emitted by other components
    useEffect(() => {
        const handler = (list) => {
            try {
                if (!list) {
                    const raw = localStorage.getItem('advertiser_campaigns');
                    if (raw) setCampaigns(JSON.parse(raw) || []);
                    return;
                }
                // If event payload is an array, use it; else re-read localStorage
                if (Array.isArray(list)) setCampaigns(list);
                else {
                    const raw = localStorage.getItem('advertiser_campaigns');
                    if (raw) setCampaigns(JSON.parse(raw) || []);
                }
            } catch (e) {}
        };
        try { busOn('advertiser:campaigns_updated', handler); } catch (e) {}
        // also listen to storage events (other tabs)
        const onStorage = (ev) => {
            try {
                if (!ev.key) return;
                if (ev.key === 'advertiser_campaigns') {
                    const raw = localStorage.getItem('advertiser_campaigns');
                    if (raw) setCampaigns(JSON.parse(raw) || []);
                    else setCampaigns([]);
                }
            } catch (e) {}
        };
        window.addEventListener('storage', onStorage);
        return () => {
            try { busOff('advertiser:campaigns_updated', handler); } catch (e) {}
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    // Persist previewUrl to localStorage when it changes
    useEffect(() => {
        try {
            if (previewUrl) localStorage.setItem('brand_preview_url', previewUrl);
        } catch (e) {}
    }, [previewUrl]);

    // Injecting the custom keyframes for the pulsing effect
    const styleSheet = `
        @keyframes pulse-glow {
            0% { box-shadow: 0 0 0 0 rgba(var(--color-gold-rgb),0.5); }
            70% { box-shadow: 0 0 0 10px rgba(var(--color-gold-rgb),0); }
            100% { box-shadow: 0 0 0 0 rgba(var(--color-gold-rgb),0); }
        }
        .animate-pulse-glow { animation: pulse-glow 2s infinite cubic-bezier(0.4, 0, 0.6, 1); }
        @keyframes sticky-in { 0% { transform: translateY(-8px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .sticky-animate { animation: sticky-in 220ms ease forwards; }
    `;

    // Map of pages to components
    const pageComponents = {
        'Home': HomePage,
        'Welcome': WelcomePage,
        'BrandDetails': BrandDetailsPage,
        'BrandVoice': BrandVoicePage,
        // We'll render BrandLogo and AdvertiserDashboard below with props
        'BrandLogo': BrandLogoPage,
        'AdvertiserDashboard': AdvertiserDashboard,
        'StartCollaboration': StartCollaboration,
        'SponsorshipFormat': SponsorshipFormat,
        'SponsorUserRequests': SponsorUserRequests,
        'AudienceSelection': AudienceSelection,
            'ShareVision': ShareVision,
            'MeetCreators': MeetCreators,
        'SponsorSummary': SponsorSummary,
            'EscrowSummary': EscrowSummary,
            'PaymentMethods': PaymentMethods,
        'CampaignDetails': null,
    };
    
    const CurrentPage = pageComponents[currentPage] || HomePage;

    // Lightweight DOM-based translation pass for the currently selected language.
    // Replaces matching text nodes after mount using the translations map to avoid rewriting all JSX.
    useEffect(() => {
        try {
            if (typeof window === 'undefined') return;
            const lang = window.localStorage.getItem('regaarder_language') || 'English';
            // If English (default) or no translations available for the chosen language, skip
            if (!lang || lang === 'English') return;
            const map = translations && translations[lang] ? translations[lang] : {};
            if (!map || Object.keys(map).length === 0) return;
            const container = document.querySelector('.min-h-screen') || document.body;
            if (!container) return;
            const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
            const keys = Object.keys(map).sort((a,b) => b.length - a.length);
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
        } catch (e) { /* ignore */ }
    }, []);


    return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-start">
        
        {/* Inject the custom CSS animation */}
        <style dangerouslySetInnerHTML={{ __html: styleSheet }} />

        {/* Sticky Header Component */}
        <StickyHeader ACCENT_COLOR={ACCENT_COLOR} setCurrentPage={setCurrentPage} visible={showSticky} />

        {/* Main scrollable content area with proper spacing for footer */}
        <div className="flex-1 w-full overflow-y-auto">
            <div className="py-6 sm:py-8 px-4 sm:px-6">
                {/* Main Content Card */}
                <div className={`${currentPage === 'AdvertiserDashboard' ? 'max-w-4xl' : 'max-w-md'} mx-auto w-full bg-white rounded-2xl p-6 sm:p-8`}> 
                    {/* Conditional Rendering based on currentPage state */}
                    {currentPage === 'BrandLogo' && (
                        <BrandLogoPage
                            ACCENT_COLOR={ACCENT_COLOR}
                            HIGHLIGHT_COLOR={HIGHLIGHT_COLOR}
                            ICON_BACKGROUND={ICON_BACKGROUND}
                            setCurrentPage={setCurrentPage}
                            setShowSticky={setShowSticky}
                            uploadedFile={uploadedFile}
                            previewUrl={previewUrl}
                            setUploadedFile={setUploadedFile}
                            setPreviewUrl={setPreviewUrl}
                        />
                    )}

                    {currentPage === 'AdvertiserDashboard' && (
                        <AdvertiserDashboard
                            setCurrentPage={setCurrentPage}
                            ACCENT_COLOR={ACCENT_COLOR}
                            previewUrl={previewUrl}
                            uploadedFile={uploadedFile}
                            campaigns={campaigns}
                            onViewCampaign={(id) => { setSelectedCampaignId(id); setSelectedCampaignMode('view'); setCurrentPage('CampaignDetails'); }}
                            onEditCampaign={(id) => { setSelectedCampaignId(id); setSelectedCampaignMode('edit'); setCurrentPage('CampaignDetails'); }}
                        />
                    )}

                    {currentPage === 'CampaignDetails' && (
                        <CampaignDetails
                            setCurrentPage={setCurrentPage}
                            campaign={campaigns.find(c => c.id === selectedCampaignId)}
                            onSave={(updated) => {
                                const next = campaigns.map(p => p.id === updated.id ? { ...p, ...updated } : p);
                                try { localStorage.setItem('advertiser_campaigns', JSON.stringify(next)); } catch (e) {}
                                setCampaigns(next);
                                try { busEmit('advertiser:campaigns_updated', next); } catch (e) {}
                            }}
                            readOnly={selectedCampaignMode === 'view'}
                        />
                    )}

                    {currentPage !== 'BrandLogo' && currentPage !== 'AdvertiserDashboard' && (
                        <CurrentPage 
                            ACCENT_COLOR={ACCENT_COLOR} 
                            HIGHLIGHT_COLOR={HIGHLIGHT_COLOR} 
                            ICON_BACKGROUND={ICON_BACKGROUND}
                            setCurrentPage={setCurrentPage}
                            setShowSticky={setShowSticky}
                        />
                    )}
                </div>
            </div>
            {/* Bottom spacing to ensure content doesn't hide behind footer navbar */}
            <div className="h-24"></div>
        </div>
        
        {/* Bottom Mobile Navigation */}
        <SharedBottomBar selectedLanguage={(typeof window !== 'undefined') ? (localStorage.getItem('regaarder_language') || 'English') : 'English'} activeTabOverride="Home" />
        </div>
    );
};

export default App;
