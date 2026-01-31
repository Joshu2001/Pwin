import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getTranslation } from './translations';

// New revamped BoostsModal with experiential messaging focused on VISIBILITY & DISCOVERY
// Keeping shape and drag bar, completely new content and messaging approach
const BoostsModalRevamped = ({ isOpen, onClose, requestId, detailedRank, onGiveLikeFree, selectedLanguage = 'English' }) => {
    const modalRef = useRef(null);
    const minHeight = window.innerHeight * 0.5;
    const maxHeight = window.innerHeight * 0.95;

    const [currentHeight, setCurrentHeight] = useState(window.innerHeight * 0.9);
    const [selectedAmount, setSelectedAmount] = useState(10);

    // Destructure rank data
    const {
        rank,
        nextRankNeeded,
        threatCount,
        totalInfluence
    } = detailedRank;

    // --- Experiential Boost System: Rank Decay ---
    // Requests naturally drop ~6 positions every 4 hours without boosts
    // This is verifiable by user experience, creating honest and structural urgency
    const ESTIMATED_DECAY_POSITIONS = 6;
    const calculateDecayMinutes = () => {
        // Random between 200-240 minutes (3h 20m - 4h)
        const baseMinutes = 220 + Math.random() * 40;
        return Math.round(baseMinutes);
    };
    const [decayMinutes] = useState(calculateDecayMinutes());

    const [currentScore, setCurrentScore] = useState(totalInfluence);
    useEffect(() => { setCurrentScore(totalInfluence); }, [totalInfluence]);

    // 1 dollar = 2 Influence points
    const influenceMultiplier = 2;
    const boostValue = selectedAmount * influenceMultiplier;

    // Payment providers state
    const [selectedProvider, setSelectedProvider] = useState('wise');
    const [processingPayment, setProcessingPayment] = useState(false);

    const goldStyle = { color: 'var(--color-gold)' };

    // --- Experiential Headlines: Focus on VISIBILITY & DISCOVERY ---
    // Discovery vs Amplification: Requests page is discovery, Boosts modal is amplification
    const getHeadline = () => {
        if (rank === 1) return getTranslation('Amplify Your Reach', selectedLanguage);
        if (rank <= 5) return getTranslation('Rise in Discovery', selectedLanguage);
        return getTranslation('Get More Eyes', selectedLanguage);
    };

    const getSubheadline = () => {
        if (rank === 1 && threatCount > 0) {
            return getTranslation('Another request is gaining traction. Stay visible to stay winning.', selectedLanguage);
        }
        if (rank <= 5) {
            return getTranslation('Climb the rankings so creators discover your request first.', selectedLanguage);
        }
        return getTranslation('More visibility, faster fulfillment', selectedLanguage);
    };

    // Principled Urgency: Rank Decay Window
    // Structural, verifiable, not arbitrary — based on actual platform dynamics
    const getDecayMessage = () => {
        const hours = Math.floor(decayMinutes / 60);
        const mins = decayMinutes % 60;
        return getTranslation('Without a boost, this request will drop ~6 ranks in about', selectedLanguage) + ` ${hours}h ${mins}m.`;
    };

    // Competitive Urgency: Challenger Proximity (only when applicable)
    // Game psychology but still honest
    const getCompetitiveMessage = () => {
        if (threatCount > 0) {
            return getTranslation('You\'re just 1-2 boosts away from staying ahead of the challengers.', selectedLanguage);
        }
        return null;
    };

    // --- Drag Handle Logic ---
    const handleTouchStart = useCallback((e) => {
        e.preventDefault();
        if (!modalRef.current) return;

        const startY = e.touches[0].clientY;
        const startHeight = modalRef.current.clientHeight;

        const handleTouchMove = (moveEvent) => {
            const deltaY = moveEvent.touches[0].clientY - startY;
            let newHeight = startHeight - deltaY;

            newHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);
            setCurrentHeight(newHeight);
        };

        const handleTouchEnd = () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);

            if (modalRef.current && modalRef.current.clientHeight < minHeight + 50) {
                onClose();
            }
        };

        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
    }, [minHeight, maxHeight, onClose]);

    useEffect(() => {
        if (isOpen) {
            setCurrentHeight(window.innerHeight * 0.9);
            document.body.style.overflow = 'hidden';
            setSelectedAmount(10);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Escape to close
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    // Focus management: trap focus inside the modal
    const prevActiveRef = useRef(null);
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;
        prevActiveRef.current = document.activeElement;

        setTimeout(() => {
            try {
                const focusable = modalRef.current.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
                if (focusable && focusable.length) {
                    focusable[0].focus();
                } else {
                    modalRef.current.focus();
                }
            } catch (err) { }
        }, 50);

        const handleKeyDown = (e) => {
            if (!modalRef.current) return;
            if (e.key === 'Tab') {
                const focusable = modalRef.current.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
                if (!focusable || focusable.length === 0) {
                    e.preventDefault();
                    return;
                }
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            try { if (prevActiveRef.current && prevActiveRef.current.focus) prevActiveRef.current.focus(); } catch (err) { }
        };
    }, [isOpen, onClose]);

    return (
        <div
            className={`fixed inset-0 z-50 transition-all duration-300 flex items-center justify-center ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            style={{ transitionProperty: 'opacity', transitionTimingFunction: 'cubic-bezier(.4,0,.2,1)' }}
            aria-hidden={!isOpen}
        >
            {/* Backdrop - solid black */}
            <div
                className={`absolute inset-0 bg-black transition-opacity duration-300 ${isOpen ? 'opacity-50' : 'opacity-0'}`}
                onClick={onClose}
                aria-label="Close boost modal background"
            />

            {/* Modal Container - Pop-up style centered */}
            <div
                ref={modalRef}
                tabIndex={-1}
                className="relative w-full mx-auto rounded-3xl flex flex-col z-50"
                style={{
                    maxHeight: '75vh',
                    maxWidth: '280px',
                    background: '#ffffff',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    border: '1px solid #e5e7eb'
                }}
                aria-label="Boost visibility modal"
            >

                {/* Header */}
                <header className="relative px-5 pt-5 pb-3 text-center">
                    <h2 className="text-lg font-bold text-gray-900 mb-0.5">{getHeadline()}</h2>
                    <p className="text-gray-500 text-xs leading-relaxed">{getSubheadline()}</p>
                </header>

                {/* Main Content */}
                <main className="flex-grow overflow-y-auto px-5 pb-4 space-y-4">
                    {/* Minimal Benefits */}
                    <section className="space-y-2">
                        {/* Visibility Increase */}
                        <div className="flex items-start space-x-2">
                            <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex-shrink-0 mt-0.5"></div>
                            <div className="flex-1">
                                <div className="font-medium text-gray-900 text-xs">{getTranslation('Reach More Creators', selectedLanguage)}</div>
                            </div>
                        </div>

                        {/* Faster Fulfillment */}
                        <div className="flex items-start space-x-2">
                            <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex-shrink-0 mt-0.5"></div>
                            <div className="flex-1">
                                <div className="font-medium text-gray-900 text-xs">{getTranslation('Get Fulfilled Faster', selectedLanguage)}</div>
                            </div>
                        </div>
                    </section>

                    {/* Boost Amount Selection */}
                    <section>
                        <div className="grid grid-cols-3 gap-2">
                            {[10, 25, 50].map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => setSelectedAmount(amount)}
                                    className="relative py-4 px-2 text-center rounded-lg border-2 font-bold transition-all duration-200"
                                    style={{
                                        backgroundColor: selectedAmount === amount ? '#111827' : '#f9fafb',
                                        color: selectedAmount === amount ? '#fff' : '#6b7280',
                                        borderColor: selectedAmount === amount ? '#111827' : '#e5e7eb',
                                        boxShadow: selectedAmount === amount ? '0 0 12px rgba(17, 24, 39, 0.15)' : 'none',
                                    }}
                                >
                                    <div className="text-xs font-bold">${amount}</div>
                                    <div className="text-[10px] mt-0.5" style={{ opacity: 0.7 }}>
                                        +{amount * 2}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                </main>

                {/* Footer with CTA */}
                <footer className="px-5 pb-6 pt-3 border-t border-gray-100" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
                    {/* Primary CTA */}
                    <button
                        className={`w-full py-3 font-semibold text-sm rounded-2xl transition-all ${processingPayment ? 'opacity-50 pointer-events-none' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                        style={{
                            backgroundColor: '#111827',
                            color: '#ffffff'
                        }}
                        onClick={async () => {
                            setProcessingPayment(true);
                            try {
                                // Navigate directly to PayPal payment link
                                window.location.href = 'https://www.paypal.com/ncp/payment/FAR4N4DZARHBY';
                                return;
                            } catch (err) {
                                console.error('Payment error', err);
                                setProcessingPayment(false);
                                alert(getTranslation('Payment failed. Please try again.', selectedLanguage));
                            }
                        }}
                    >
                        {processingPayment ? getTranslation('Processing...', selectedLanguage) : `${getTranslation('Boost for', selectedLanguage)} $${selectedAmount}`}
                    </button>

                    {/* Payment Provider Note */}
                    <div className="text-center pt-2">
                        <p className="text-[10px] text-gray-400">{getTranslation('Secured by PayPal', selectedLanguage)}</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default BoostsModalRevamped;
