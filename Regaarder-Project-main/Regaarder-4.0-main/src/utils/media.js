import { getBackendBaseUrl } from '../config.js';

const getBackendBase = () => {
  try {
    const base = getBackendBaseUrl();
    return base ? String(base).replace(/\/$/, '') : '';
  } catch {
    return '';
  }
};

export const resolveMediaUrl = (input) => {
  if (!input) return '';
  const raw = String(input).trim();
  if (!raw) return '';
  // blob: and data: URLs are temporary (browser-session only) — never persist or display them
  if (raw.startsWith('blob:') || raw.startsWith('data:')) return '';

  const backend = getBackendBase();

  if (/^[a-z0-9.-]+(?::\d+)?\//i.test(raw) && !/^https?:\/\//i.test(raw)) {
    return `https://${raw}`;
  }

  if (raw.startsWith('uploaded:')) {
    const suffix = raw.slice('uploaded:'.length).trim();
    const normalized = String(suffix || '')
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .split(/[?#]/)[0];
    const filename = normalized.split('/').filter(Boolean).pop() || '';
    if (!filename) return '';
    if (!backend) return `/uploads/${filename}`;
    return `${backend}/uploads/${filename}`;
  }

  // Handle plain device-uploaded filenames persisted without prefix/path.
  if (!/^https?:\/\//i.test(raw) && !raw.startsWith('/') && !raw.includes('://') && !raw.includes('/')) {
    const looksLikeMediaFile = /\.(png|jpe?g|gif|webp|bmp|svg|mp4|mov|m4v|webm|avi|mkv)$/i.test(raw);
    if (looksLikeMediaFile) {
      return backend ? `${backend}/uploads/${raw}` : `/uploads/${raw}`;
    }

    // Legacy persisted names can include a UUID suffix after extension, e.g. image.jpg-<uuid>.
    const hasEmbeddedMediaExt = /\.(png|jpe?g|gif|webp|bmp|svg|mp4|mov|m4v|webm|avi|mkv)(?:[-_].+)?$/i.test(raw);
    if (hasEmbeddedMediaExt) {
      return backend ? `${backend}/uploads/${raw}` : `/uploads/${raw}`;
    }
  }

  // Handle relative uploads paths emitted by backend/client code.
  if (/^uploads\//i.test(raw)) {
    return backend ? `${backend}/${raw.replace(/^\/+/, '')}` : `/${raw.replace(/^\/+/, '')}`;
  }

  try {
    if (/^https?:\/\//i.test(raw)) {
      const backendUrl = backend ? new URL(backend) : null;
      const mediaUrl = new URL(raw);
      const host = String(mediaUrl.hostname || '').toLowerCase();
      const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';

      if (backendUrl) {
        // Keep backend media on backend host/protocol and rewrite localhost artifacts.
        if (mediaUrl.hostname === backendUrl.hostname || isLocalhost) {
          mediaUrl.protocol = backendUrl.protocol;
          mediaUrl.host = backendUrl.host;
          return mediaUrl.toString();
        }
        if (backendUrl.protocol === 'https:' && raw.startsWith('http://') && /onrender\.com$/i.test(mediaUrl.hostname)) {
          mediaUrl.protocol = 'https:';
          return mediaUrl.toString();
        }
      }

      return mediaUrl.toString();
    }

    if (raw.startsWith('/')) {
      return backend ? `${backend}${raw}` : raw;
    }

    if (backend) {
      const url = new URL(raw, `${backend}/`);
      return url.toString();
    }
  } catch {
    return raw;
  }

  return raw;
};

export default resolveMediaUrl;
