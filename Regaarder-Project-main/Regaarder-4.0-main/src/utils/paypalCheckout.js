import { WEB_URL, getBackendBaseUrl } from '../config.js';

export const getSafeReturnBaseUrl = (fallbackBase = WEB_URL) => {
    try {
        const origin = String(window.location.origin || '').trim();
        if (/^https?:\/\//i.test(origin)) return origin;
    } catch (e) { }

    try {
        const normalized = String(fallbackBase || '').trim();
        if (/^https?:\/\//i.test(normalized)) return normalized.replace(/\/$/, '');
    } catch (e) { }

    return WEB_URL;
};

export const getSafeReturnPath = (fallbackPath = '/') => {
    try {
        const pathname = String(window.location.pathname || '').trim();
        if (pathname && pathname.startsWith('/')) return pathname;
    } catch (e) { }
    return String(fallbackPath || '/').startsWith('/') ? String(fallbackPath || '/') : '/';
};

export const normalizePaymentError = (value, fallbackMessage = 'Unable to start payment') => {
    if (!value) return fallbackMessage;

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return fallbackMessage;
        // Discard raw HTML error pages (e.g. Express "Cannot POST" 404)
        if (/^\s*</.test(trimmed) || /<!doctype/i.test(trimmed)) return fallbackMessage;
        return trimmed;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            const resolved = normalizePaymentError(item, '');
            if (resolved) return resolved;
        }
        return fallbackMessage;
    }

    if (typeof value === 'object') {
        const preferred = [
            value.error_description,
            value.error,
            value.message,
            value.details,
            value.description
        ];

        for (const candidate of preferred) {
            const resolved = normalizePaymentError(candidate, '');
            if (resolved) return resolved;
        }

        try {
            return JSON.stringify(value);
        } catch (e) {
            return fallbackMessage;
        }
    }

    return String(value || fallbackMessage);
};

export const startPayPalCheckout = async ({
    endpoint,
    token,
    body,
    fallbackError = 'Unable to start payment',
    backendBaseUrl
}) => {
    const resolvedBase = String(backendBaseUrl || getBackendBaseUrl() || '').replace(/\/$/, '');
    const resolvedEndpoint = String(endpoint || '').startsWith('/') ? String(endpoint) : `/${String(endpoint || '')}`;
    const response = await fetch(`${resolvedBase}${resolvedEndpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body || {})
    });

    const rawText = await response.text().catch(() => '');
    const payload = (() => {
        if (!rawText) return {};
        try {
            return JSON.parse(rawText);
        } catch (e) {
            // Don't funnel raw HTML into the payload — discard non-JSON responses
            return {};
        }
    })();

    if (!response.ok || !payload.approveUrl) {
        throw new Error(normalizePaymentError(payload, fallbackError));
    }

    return payload;
};
