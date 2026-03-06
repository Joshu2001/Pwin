import React, { useEffect, useState } from 'react';
import { X, DollarSign, CreditCard } from 'lucide-react';
import { getTranslation } from './translations.js';
import { WEB_URL, getBackendBaseUrl } from './config.js';
import { getSafeReturnBaseUrl, startPayPalCheckout } from './utils/paypalCheckout.js';

const SuggestionPaymentModal = ({
    isOpen,
    onClose,
    requestId,
    targetCreatorId,
    targetCreatorHandle,
    suggestionText,
    selectedLanguage = 'English'
}) => {
    const paypalClientId =
        (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PAYPAL_CLIENT_ID)
        || 'AUhb8uHt0gFlWH_vJdLf7M4soE91VyQuy5NHDPvLumnynuAFQj4mMuXdXHi9Vzy6nlRpaD0d2VGKpHtC';

    const [amount, setAmount] = useState('2');
    const [payerLabel, setPayerLabel] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [paypalSdkReady, setPaypalSdkReady] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setAmount('2');
        setPayerLabel('');
        setProcessing(false);
        setError('');
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const existing = document.querySelector('script[data-paypal-suggestion="1"]');
        if (existing || (typeof window !== 'undefined' && window.paypal)) {
            setPaypalSdkReady(true);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(paypalClientId)}&currency=USD&intent=capture`;
        script.async = true;
        script.setAttribute('data-paypal-suggestion', '1');
        script.onload = () => setPaypalSdkReady(true);
        script.onerror = () => {
            setPaypalSdkReady(false);
            setError('Could not load PayPal. Please check your connection and try again.');
        };
        document.body.appendChild(script);
    }, [isOpen, paypalClientId]);

    useEffect(() => {
        if (!isOpen) return;
        const onEsc = (event) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onEsc);
        return () => window.removeEventListener('keydown', onEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const numericAmount = Number(amount || 0);
    const isAmountValid = Number.isFinite(numericAmount) && numericAmount >= 2;

    const handleCreatePayPalOrder = async () => {
        if (processing) return;
        if (!paypalSdkReady) {
            setError('PayPal is still loading. Please wait a moment and try again.');
            return;
        }
        const trimmedText = String(suggestionText || '').trim();
        if (!trimmedText) {
            setError('Please add a suggestion first.');
            return;
        }
        if (!isAmountValid) {
            setError('Minimum funded suggestion amount is $2.00');
            return;
        }

        const token = localStorage.getItem('regaarder_token');
        if (!token) {
            setError('Please sign in to fund a suggestion.');
            return;
        }

        setProcessing(true);
        setError('');

        try {
            const payload = await startPayPalCheckout({
                endpoint: '/suggestions/funded/paypal/create-order',
                token,
                body: {
                    requestId,
                    targetCreatorId: targetCreatorId || null,
                    targetCreatorHandle: targetCreatorHandle || null,
                    text: trimmedText,
                    amount: numericAmount,
                    payerLabel: String(payerLabel || '').trim(),
                    returnBaseUrl: getSafeReturnBaseUrl(WEB_URL)
                },
                fallbackError: 'Unable to start PayPal payment',
                backendBaseUrl: getBackendBaseUrl()
            });

            window.location.href = payload.approveUrl;
        } catch (err) {
            setError(err.message || 'Payment setup failed. Please try again.');
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div
                className="relative w-full rounded-3xl border border-gray-200 bg-white shadow-2xl"
                style={{ maxWidth: '420px' }}
            >
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-1 text-gray-500 transition hover:bg-gray-100"
                    aria-label="Close payment modal"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="px-5 pt-6 pb-3 text-center">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                        <CreditCard className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{getTranslation('Support This Suggestion', selectedLanguage)}</h3>
                    <p className="mt-1 text-sm text-gray-500">{getTranslation('Fund it with PayPal so creators can prioritize it.', selectedLanguage)}</p>
                </div>

                <div className="space-y-3 px-5 pb-4">
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {getTranslation('Amount (USD)', selectedLanguage)}
                        </label>
                        <div className="flex items-center rounded-xl border border-gray-200 bg-white px-3">
                            <DollarSign className="mr-1 h-4 w-4 text-gray-500" />
                            <input
                                type="number"
                                min="2"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full rounded-xl py-3 text-sm text-gray-800 outline-none"
                                placeholder="2.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {getTranslation('Display name (optional)', selectedLanguage)}
                        </label>
                        <input
                            type="text"
                            value={payerLabel}
                            onChange={(e) => setPayerLabel(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-800 outline-none focus:border-indigo-300"
                            placeholder={getTranslation('Name for this support', selectedLanguage)}
                        />
                    </div>

                    <p className="text-[11px] text-gray-500">{getTranslation('Your suggestion becomes visible after payment confirmation.', selectedLanguage)}</p>

                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>

                <div className="border-t border-gray-100 px-5 pb-6 pt-4" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
                    <button
                        onClick={handleCreatePayPalOrder}
                        disabled={processing || !isAmountValid}
                        className={`w-full rounded-2xl py-3 text-sm font-semibold text-white transition ${processing || !isAmountValid ? 'cursor-not-allowed bg-gray-400' : 'bg-gray-900 hover:scale-[1.01] active:scale-[0.99]'}`}
                    >
                        {processing ? getTranslation('Processing...', selectedLanguage) : getTranslation('Add Suggestion', selectedLanguage)}
                    </button>
                    <p className="pt-2 text-center text-[10px] text-gray-400">{getTranslation('Secured by PayPal', selectedLanguage)}</p>
                </div>
            </div>
        </div>
    );
};

export default SuggestionPaymentModal;
